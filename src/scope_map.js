import {
  createScopeProxy,
  EL_ATTR,
} from "./scope_common.js";

export function createMapProxy(bInstance, valueChangedEvent, obj, ownProp, superScope, createRecursiveScope) {
  const origMapSet = obj.set;
  const mapSetFct = proxy => function(key, value) {
    const proxifiedValue = createRecursiveScope(bInstance, superScope && superScope[EL_ATTR], valueChangedEvent, value, key, proxy);
    if (obj.get(key) != proxifiedValue) {
      const old = new Map(obj.entries());
      const ret = origMapSet.call(obj, key, proxifiedValue);
      valueChangedEvent(superScope, ownProp, old, obj);
      return ret;
    } else {
      return origMapSet.call(obj, key, proxifiedValue);
    }
  };
  const origMapClear = obj.clear;
  const mapClearFct = proxy => function() {
    if (obj.size) {
      const old = new Map(obj.entries());
      const ret = origMapClear.call(obj);
      valueChangedEvent(superScope, ownProp, old, obj);
      return ret;
    } else {
      return origMapClear.call(obj);
    }
  };
  const origMapDelete = obj.delete;
  const mapDeleteFct = proxy => function(key) {
    if (obj.has(key)) {
      const old = new Map(obj.entries());
      const ret = origMapDelete.call(obj, key);
      valueChangedEvent(superScope, ownProp, old, obj);
      return ret;
    } else {
      return origMapDelete.call(obj, key);
    }
  };
  const proxy = createScopeProxy(bInstance, superScope, ownProp, null, obj, {
    get(target, prop, receiver) {
      if (prop == 'set') {
        return mapSetFct(receiver);
      } else if (prop == 'clear') {
        return mapClearFct(receiver);
      } else if (prop == 'delete') {
        return mapDeleteFct(receiver);
      } else {
        let value = target[prop];
        if (typeof value == 'function') {
          value = value.bind(target);
        }
        return value;
      }
    },
  });
  for (const [key, value] of obj.entries()) {
    const proxifiedValue = createRecursiveScope(bInstance, superScope && superScope[EL_ATTR], valueChangedEvent, value, key, proxy);
    if (value != proxifiedValue) {
      obj.set(key, proxifiedValue);
    }
  }
  return proxy;
}
