import {
  Core,
  setStaticProperty,
  setStaticFunction,
} from "./core.js";
import {
  createProxy,
} from "./proxy.js";
import {
  SCOPE_NAME_ATTR,
  SUPER_ATTR,
  EL_ATTR,
} from "./scope_common.js";
import {
  createScope,
} from "./scope.js";
import * as injectors from "./injectors.js";
import * as directives from "./directives.js";
import * as filters from "./filters.js";

/*
 * BJS framework
 */
class Bjs extends Core {
  constructor(doc) {
    super();
    if (!doc) {
      // try document
      doc = document;
    }
    this.doc = doc;
    Core.registerInjector(this.constructor.BIND_ATTR, injectors.injectorBval);
    this.scope = this.createScope();
    this.watchers = this.createWatchers();
    // allow plugins to modify Bjs
    const bPluginEvent = new CustomEvent(this.constructor.PLUGIN_EVENT, { detail: this });
    this.doc.dispatchEvent(bPluginEvent);
    this._templates = this.createTemplates();
    this.evaluateTemplates();
    this.findBinds();
    const bReadyEvent = new CustomEvent(this.constructor.READY_EVENT, { detail: this });
    this.doc.dispatchEvent(bReadyEvent);
  }

  createScope(domElement, scope, superScope) {
    const $valueChangedEvent = this.valueChangedEvent.bind(this);
    const realScope = createScope(this, domElement || this.doc, $valueChangedEvent, scope, '', superScope);
    return realScope;
  }

  createWatchers() {
    const $watchers = {};
    return createProxy($watchers, {
      get(target, prop, receiver) {
        if (!(prop in $watchers)) {
          $watchers[prop] = [];
        }
        return $watchers[prop];
      },
    });
  }

  valueChangedEvent(scope, property, oldValue, newValue) {
    this.triggerWatchers(scope, property, oldValue, newValue);
    this.evaluateTemplates();
    this.applyValues(scope);
  }

  triggerWatchers(scope, propertyName, oldValue, newValue) {
    const propertyNames = [propertyName];
    let n = 0;
    const MAX_RECURS = 1000;
    for (let localScope = scope; localScope; localScope = localScope[SUPER_ATTR]) {
      const localPropName = localScope[SCOPE_NAME_ATTR];
      if (localPropName) {
        propertyNames.unshift(localPropName);
      } else {
        break; // loop scope or root scope reached
      }
      n++;
      if (n == MAX_RECURS) {
        console.error(`${MAX_RECURS} recursion reached in scope ${scope} to reach rootScope`);
        return;
      }
    }
    let localScope = scope;
    let localOldValue = oldValue;
    let localNewValue = newValue;
    for (let i = propertyNames.length; i > 0; i--) {
      const fullPropertyName = propertyNames.slice(0, i).join('.');
      const localProperty = propertyNames[i - 1];
      const oldScope = {...localScope};
      oldScope[localProperty] = localOldValue;
      this.watchers[fullPropertyName].forEach(watcher => watcher(localNewValue, localOldValue, localScope, localProperty));
      localOldValue = oldScope;
      localNewValue = localScope;
      localScope = localScope[SUPER_ATTR];
    }
  }

  applyValues(scope) {
    const domElement = scope[EL_ATTR];
    for (const [injector, func] of this.injectors.entries()) {
      if (func) {
        const ownElement = domElement.hasAttribute && domElement.hasAttribute(injector) ? [domElement] : [];
        for (let elt of [...ownElement, ...domElement.querySelectorAll(`* [${injector}]`)]) {
          func.call(this, scope, elt, elt.getAttribute(injector), injector);
        }
      }
    }
  }

  createTemplates() {
    if (this.directives.size == 0) {
      return [];
    }
    const selector = [...this.directives.keys()].map(directive => `* [${directive}]`).join(', ');
    const templates = [];
    for (let elt of [...this.doc.querySelectorAll(selector)].reverse()) {
      const eltCloned = elt.cloneNode(true);
      const template = this.doc.createElement('template');
      template.setAttribute('type', 'bjs');
      for (const directive of this.directives.keys()) {
        if (eltCloned.hasAttribute(directive)) {
          template.setAttribute('directive', directive);
          template.setAttribute('expr', eltCloned.getAttribute(directive));
          eltCloned.removeAttribute(directive);
          break;
        }
      }
      template.content.appendChild(eltCloned);
      elt.replaceWith(template);
      template.nbElts = 0;
      templates.push(template);
    }
    return templates.slice().reverse().filter(template => template.isConnected);
  }

  evaluateTemplates() {
    for (let template of this._templates) {
      this.evaluateTemplate(template, this.scope);
    }
  }

  evaluateTemplate(template, scope) {
    const directive = template.getAttribute('directive');
    const expr = template.getAttribute('expr');
    if (!directive || !expr) {
      return;
    }
    const func = this.directives.get(directive);
    if (func) {
      const results = func.call(this, scope, template.content.firstChild, expr, directive);
      // remove previously inserted elements
      for (let i = 0; i < template.nbElts; i++) {
        template.nextSibling && template.nextSibling.remove();
      }
      template.nbElts = 0;
      if (results && results.length) {
        for (let result of results) {
          const [element, localScope] = result;
          // render recursively any sub template of each element
          for (let subTemplate of element.querySelectorAll('template')) {
            if (subTemplate.getAttribute('type') == 'bjs') {
              this.evaluateTemplate(subTemplate, localScope);
            }
          }
        }
        template.after(...results.map(res => res[0]));
        template.nbElts = results.length;
      }
    } else {
      console.error(`function is not defined for directive ${directive}`);
    }
  }

  findBinds(doc, scope) {
    const selector = `* [${this.constructor.BIND_ATTR}]`;
    for (let elt of (doc || this.doc).querySelectorAll(selector)) {
      const varName = elt.getAttribute(this.constructor.BIND_ATTR)
      if (varName) {
        if (varName.indexOf('.') != -1 || varName.indexOf('[') != -1) {
          throw `${varName} expression is forbidden in ${this.constructor.BIND_ATTR}, you can only use raw variable name`;
        }
        this.addBind(scope, elt, varName);
      }
    }
  }

  addBind(scope, elt, varName) {
    elt.bKeyupEvent = function(event) {
      this.scope[this.name] = this.b.getBindValue(this.elt);
    }.bind({
      b: this,
      name: varName,
      elt: elt,
      scope: scope || this.scope,
    });
    elt.addEventListener('keyup', elt.bKeyupEvent);
    elt.bKeyupEvent();
  }

  getBindValue(elt) {
    if (elt) {
      if (elt.type) {
        return elt.value
      } else {
        return elt.innerText
      }
    }
  }
}

/* static properties and methods */
setStaticProperty(Bjs, 'PLUGIN_EVENT', 'bplugin');
setStaticProperty(Bjs, 'READY_EVENT', 'bready');
setStaticProperty(Bjs, 'BLOAD_ATTR', 'bload');
setStaticProperty(Bjs, 'BIND_ATTR', 'bbind');

setStaticFunction(Bjs, 'getCssDirectivesRule', function() {
  return Core.directives.size ? ([...Core.directives.keys()].map(bdir => `* [${bdir}]`).join(', ') + '{ display: none; }') : '';
});

setStaticFunction(Bjs, 'load', function(doc, cb) {
  const b = new this(doc);
  if (cb && typeof cb == 'function') {
    cb(b);
  }
});

const isBrowser = new Function("try{return this===window;}catch(e){return false;}");
const isNode = new Function("try{return this===global;}catch(e){return false;}");

if (isBrowser && isNode) {
  if (isBrowser) {
    window.Bjs = Bjs;
    const cssDirectives = Bjs.getCssDirectivesRule();
    if (cssDirectives) {
      const bcss = document.createElement('style');
      bcss.type = 'text/css'
      bcss.rel = 'stylesheet'
      document.head.appendChild(bcss);
      bcss.sheet.insertRule(Bjs.getCssDirectivesRule(), 0);
    }
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body.hasAttribute(Bjs.BLOAD_ATTR)) {
        document.body.removeAttribute(Bjs.BLOAD_ATTR);
        Bjs.load(document);
      }
    });
  } else if (isNode) {
    global.Bjs = Bjs;
  }
}

export default Bjs;
