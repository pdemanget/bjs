import {
  createProxy,
  setObjectPropValue,
  deleteObjectProp,
  isProxyAttr,
} from "./proxy.js";
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

const superAttr = "$super";
const instAttr = "$b";

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

  get superAttr() {
    return superAttr;
  }

  get instAttr() {
    return instAttr;
  }

  createScope(scope, superScope) {
    const $superAttr = this.superAttr;
    const $instAttr = this.instAttr;
    const $super = superScope || null;
    const $bInstance = this;
    const $scope = scope || {};
    const $valueChangedEvent = this.valueChangedEvent.bind(this);
    return createProxy($scope, {
      has(target, prop) {
        return (
          prop in $scope
          || prop == $instAttr
          || ($super != null && prop == $superAttr)
          || ($super != null && prop in $super)
        );
      },
      get(target, prop, receiver) {
        if (prop == isProxyAttr) {
          return true;
        } else if (prop == $instAttr) {
          return $bInstance;
        } else if ($super != null && prop == $superAttr) {
          return $super;
        } else if ($super != null && !(prop in $scope)) {
          return $super[prop];
        } else {
          return $scope[prop];
        }
      },
      set(target, prop, value, receiver) {
        const old = typeof $scope[prop] == "object" ? Object.assign({}, $scope[prop]) : $scope[prop];
        const valueChangedEvent = function() {
          $valueChangedEvent(prop, old, value);
        }
        return setObjectPropValue($scope, prop, value, valueChangedEvent);
      },
      deleteProperty(target, prop) {
        const old = typeof $scope[prop] == "object" ? Object.assign({}, $scope[prop]) : $scope[prop];
        const valueChangedEvent = function() {
          $valueChangedEvent(prop, old);
        }
        return deleteObjectProp($scope, prop, valueChangedEvent);
      },
    });
  }

  createWatchers() {
    const $watchers = {};
    return createProxy($watchers, {
      get(target, prop, receiver) {
        if (prop == isProxyAttr) {
          return true;
        } else {
          if (!(prop in $watchers)) {
            $watchers[prop] = [];
          }
          return $watchers[prop];
        }
      },
    });
  }

  valueChangedEvent(name, old, value) {
    this.watchers[name].forEach(watcher => watcher(value, old));
    this.evaluateTemplates();
    this.setBoundValues(name, this.scope, this.doc);
  }

  escapeRegex(s) {
    // https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
    return s.replace(/[\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }


  setBoundValues(name, scope, rootElt) {
    const selector = `* [bval^="${name}"], * [bbind^="${name}"]`;
    const regex = new RegExp(`^${this.escapeRegex(name)}([[.|].+)?$`);
    for (let elt of rootElt.querySelectorAll(selector)) {
      const varExpr = elt.getAttribute('bval') || elt.getAttribute('bbind');
      if (regex.test(varExpr)) {
        const value = getValueFromExpr(scope, varExpr);
        if (elt.type) {
          elt.value = value === undefined ? '' : value;
        } else {
          elt.innerText = value === undefined ? '' : value;
        }
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
      elt.parentElement.replaceChild(template, elt);
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
    const value = getValueFromExpr(scope, varExpr);
    if (value) {
      res.push([element.cloneNode(true), scope]);
    }
    return res;
  }

  renderTemplateBfor(scope, element, varExpr) {
    const res = [];
    const iterable = getValueFromExpr(scope, varExpr);
    if (iterable && iterable.entries) {
      for (let entry of iterable.entries()) {
        const oneElt = element.cloneNode(true);
        const localScope = this.createScope({
          "$index": entry[0],
          "$value": entry[1],
        }, scope);
        for (let subVarExpr of this.findVarExprs(oneElt)) {
          this.setBoundValues(subVarExpr, localScope, oneElt);
        }
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

  findVarExprs(rootElt) {
    const varExprs = [];
    const selector = '* [bval], * [bbind]';
    for (let elt of rootElt.querySelectorAll(selector)) {
      const varExpr = elt.getAttribute('bval') || elt.getAttribute('bbind');
      if (varExpr && !varExprs.includes(varExpr)) {
        varExprs.push(varExpr);
      }
    }
    return varExprs;
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

try {
  // document is not defined in nodejs
  if (document) {
    document.addEventListener('DOMContentLoaded', () => new Bjs(document));
  }
} catch (e) {
  // nodejs
}

export default Bjs;
