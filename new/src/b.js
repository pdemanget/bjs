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

  findBinds() {
    const bindElts = this.doc.querySelectorAll('* [bbind]');
    for (let elt of bindElts) {
      const varName = elt.getAttribute('bbind').trim()
      if (varName) {
        this.addBind(elt, varName);
      }
    }
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

  setBoundValues(name) {
    const value = this.scope[name];
    const selector = `* [bval="${name}"]`;
    for (let elt of this.doc.querySelectorAll(selector)) {
      if (elt.type) {
        elt.value = value;
      } else {
        elt.innerText = value;
      }
    }
  }

  valueChangedEvent(name, old, value) {
    this.scope[name] = value;
    (this.watchers[name] || []).forEach(watcher => watcher(value, old));
    this.setBoundValues(name);
  }

  addBind(elt, varName) {
    elt.bKeyupEvent = function(event) {
      const old = this.scope[this.name];
      const value = this.b.getBindValue(this.elt);
      if (old != value) {
        this.b.valueChangedEvent(this.name, old, value);
      }
    }.bind({
      b: this,
      name: varName,
      elt: elt,
      scope: this.scope,
    });
    elt.addEventListener('keyup', elt.bKeyupEvent);
    elt.bKeyupEvent();
  }
}

const b = new Bjs();
// document is not defined in nodejs
if (document) {
  document.addEventListener('DOMContentLoaded', () => b.init(document));
}

export default b;
