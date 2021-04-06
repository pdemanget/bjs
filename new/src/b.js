/*
 * BJS framework
 */
class Bjs {
  extend(o) {
    for (k in o) {
      this[k] = o[k];
    }
  }

  init(doc) {
    if (!doc) {
      // try document
      doc = document;
    }
    this.doc = doc;
    this.scope = this.createScope();
    this.watchers = this.createWatchers();
    this.$conditions = ['bif', 'bfor'];
    this.$templates = this.createTemplates();
    this.evaluateTemplates();
    this.findBinds();
    const bReadyEvent = new CustomEvent('bready', { detail: this });
    this.doc.dispatchEvent(bReadyEvent);
  }

  createProxy(obj, overrides) {
    const $obj = obj || {};
    const handler = Object.assign({
      has(target, prop) {
        return prop in $obj;
      },
      get(target, prop, receiver) {
        return $obj[prop];
      },
      set(target, prop, value, receiver) {
        $obj[prop] = value;
        return true;
      },
      deleteProperty(target, prop) {
        if (prop in $obj) {
          delete $obj[prop];
        }
        return true;
      },
      ownKeys(target) {
        return Object.keys($obj);
      },
    }, overrides || {});
    return new Proxy({}, handler);
  }

  createScope() {
    const $scope = {};
    const valueChangedEvent = this.valueChangedEvent.bind(this);
    return this.createProxy($scope, {
      set(target, prop, value, receiver) {
        const old = $scope[prop];
        $scope[prop] = value;
        if (old != value) {
          valueChangedEvent(prop, old, value);
        }
        return true;
      },
      deleteProperty(target, prop) {
        if (prop in $scope) {
          const old = $scope[prop];
          valueChangedEvent(prop, old);
          delete $scope[prop];
        }
        return true;
      },
    });
  }

  createWatchers() {
    const $watchers = {};
    return this.createProxy($watchers, {
      get(target, prop, receiver) {
        if (!(prop in $watchers)) {
          $watchers[prop] = [];
        }
        return $watchers[prop];
      },
    });
  }

  valueChangedEvent(name, old, value) {
    this.scope[name] = value;
    (this.watchers[name] || []).forEach(watcher => watcher(value, old));
    this.evaluateTemplates();
    this.setBoundValues(name, this.scope, this.doc);
  }

  setBoundValues(name, scope, rootElt) {
    const value = scope[name];
    const selector = `* [bval="${name}"], * [bbind="${name}"]`;
    for (let elt of rootElt.querySelectorAll(selector)) {
      if (elt.type) {
        elt.value = value;
      } else {
        elt.innerText = value;
      }
    }
  }

  createTemplates() {
    const selector = this.$conditions.map(cond => `* [${cond}]`).join(',');
    const templates = [];
    for (let elt of [...this.doc.querySelectorAll(selector)].reverse()) {
      const eltCloned = elt.cloneNode(true);
      const template = document.createElement('template');
      template.setAttribute('type', 'bjs');
      for (let cond of this.$conditions) {
        if (eltCloned.hasAttribute(cond)) {
          template.setAttribute('cond', cond);
          template.setAttribute('var', eltCloned.getAttribute(cond));
          eltCloned.removeAttribute(cond);
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
    for (let template of this.$templates) {
      this.evaluateTemplate(template);
    }
  }

  evaluateTemplate(template) {
    const cond = template.getAttribute('cond');
    const varName = template.getAttribute('var');
    if (!cond || !varName) {
      return;
    }
    const condCamel = cond[0].toUpperCase() + cond.substring(1);
    const funcName = `renderTemplate${condCamel}`;
    if (funcName in this) {
      const elements = this[funcName](template.content.firstChild, varName);
      // remove previously inserted elements
      for (let i = 0; i < template.nbElts; i++) {
        template.nextSibling && template.nextSibling.remove();
      }
      template.nbElts = 0;
      if (elements && elements.length) {
        for (let element of elements) {
          // render recursively any sub template of each element
          for (let subTemplate of element.querySelectorAll('template')) {
            if (subTemplate.getAttribute('type') == 'bjs') {
              this.evaluateTemplate(subTemplate);
            }
          }
        }
        template.after(...elements);
        template.nbElts = elements.length;
      }
    } else {
      console.error(`${funcName} is not defined in BJS`);
    }
  }

  renderTemplateBif(element, varName) {
    const elements = [];
    const value = this.scope[varName];
    if (value) {
      elements.push(element.cloneNode(true));
    }
    return elements;
  }

  renderTemplateBfor(element, varName) {
    const elements = [];
    const lst = this.scope[varName];
    // TODO handle maps and any iterable objects
    if (lst && lst.length) {
      for (let i = 0; i < lst.length; i++) {
        const oneElt = element.cloneNode(true);
        // TODO nested of nested of nested ... bfor
        // introduce $super
        const localScope = {
          "$index": i,
          "$value": lst[i],
        };
        this.setBoundValues('$index', localScope, oneElt);
        this.setBoundValues('$value', localScope, oneElt);
        elements.push(oneElt);
      }
    }
    return elements;
  }

  findBinds() {
    const selector = '* [bbind]';
    for (let elt of this.doc.querySelectorAll(selector)) {
      const varName = elt.getAttribute('bbind').trim()
      if (varName) {
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

const b = new Bjs();
// document is not defined in nodejs
if (document) {
  document.addEventListener('DOMContentLoaded', () => b.init(document));
}

export default b;
