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
import {
  getValueFromExpr,
} from "./expr.js";
import {
  addFilter,
  upperFilter,
  lowerFilter,
  capitalizeFilter,
  trimFilter,
} from "./filters.js";

/*
 * BJS framework
 */
class Bjs {
  constructor(doc) {
    if (!doc) {
      // try document
      doc = document;
    }
    this.doc = doc;
    this.scope = this.createScope();
    this.watchers = this.createWatchers();
    this.filters = new Map([
      ['add', addFilter],
      ['upper', upperFilter],
      ['lower', lowerFilter],
      ['capitalize', capitalizeFilter],
      ['trim', trimFilter],
    ]);
    this._directives = ['bif', 'bfor'];
    // fill in filters & templates
    const bPluginEvent = new CustomEvent('bplugin', { detail: this });
    this.doc.dispatchEvent(bPluginEvent);
    this._templates = this.createTemplates();
    this.evaluateTemplates();
    this.findBinds();
    const bReadyEvent = new CustomEvent('bready', { detail: this });
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
    const selector = `* [bval], * [bbind]`;
    for (let elt of domElement.querySelectorAll(selector)) {
      const varExpr = elt.getAttribute('bval') || elt.getAttribute('bbind');
      try {
        const value = getValueFromExpr(scope, varExpr);
        if (elt.type) {
          elt.value = value === undefined ? '' : value;
        } else {
          elt.innerText = value === undefined ? '' : value;
        }
      } catch (e) {
        // this could be normal to have an evaluated expression that fails
      }
    }
  }

  createTemplates() {
    const selector = this._directives.map(directive => `* [${directive}]`).join(', ');
    const templates = [];
    for (let elt of [...this.doc.querySelectorAll(selector)].reverse()) {
      const eltCloned = elt.cloneNode(true);
      const template = this.doc.createElement('template');
      template.setAttribute('type', 'bjs');
      for (let directive of this._directives) {
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
    const directiveCamel = directive[0].toUpperCase() + directive.substring(1);
    const funcName = `renderTemplate${directiveCamel}`;
    // renderTemplateBif and renderTemplateBfor 
    if (funcName in this) {
      const results = this[funcName](scope, template.content.firstChild, expr);
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
      console.error(`${funcName} is not defined in BJS`);
    }
  }

  renderTemplateBif(scope, element, varExpr) {
    const res = [];
    let value;
    try {
      value = getValueFromExpr(scope, varExpr);
    } catch(e) {
      value = false;
    }
    // ensure empty array, object, map or set are considered falsy
    if (value instanceof Map || value instanceof Set) {
      value = value.size;
    } else if (value instanceof Array || value instanceof Object) {
      value = Object.entries(value).length;
    }
    if (value) {
      res.push([element.cloneNode(true), scope]);
    }
    return res;
  }

  renderTemplateBfor(scope, element, varExpr) {
    const res = [];
    let iterable;
    try {
      iterable = getValueFromExpr(scope, varExpr);
    } catch(e) {
      iterable = null;
    }
    if (iterable && iterable.entries) {
      for (let entry of iterable.entries()) {
        const oneElt = element.cloneNode(true);
        const localScope = this.createScope(oneElt, {
          "$index": entry[0],
          "$value": entry[1],
        }, scope);
        this.applyValues(localScope);
        res.push([oneElt, localScope]);
      }
    }
    return res;
  }

  findBinds() {
    const selector = '* [bbind]';
    for (let elt of this.doc.querySelectorAll(selector)) {
      const varName = elt.getAttribute('bbind')
      if (varName) {
        if (varName.indexOf('.') != -1 || varName.indexOf('[') != -1) {
          throw `${varName} expression is forbidden in bbind, you can only use raw variable name`;
        }
        this.addBind(elt, varName);
      }
    }
  }

  addBind(elt, varName) {
    elt.bKeyupEvent = function(event) {
      this.scope[this.name] = this.b.getBindValue(this.elt);
    }.bind({
      b: this,
      name: varName,
      elt: elt,
      scope: this.scope,
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
Bjs.load = function(doc) {
  doc.addEventListener('DOMContentLoaded', () => new this(doc));
}.bind(Bjs);

const isBrowser = new Function("try{return this===window;}catch(e){return false;}");
const isNode = new Function("try{return this===global;}catch(e){return false;}");

if (isBrowser && isNode) {
  if (isBrowser) {
    window.Bjs = Bjs;
    if (document && document.body.hasAttribute('bload')) {
      document.body.removeAttribute('bload');
      Bjs.load(document);
    }
  } else if (isNode) {
    global.Bjs = Bjs;
  }
}

export default Bjs;
