import {
  createProxy,
} from "./proxy.js";
import {
  hasFct,
  getFct,
} from "./scope_common.js";

export function createSetProxy(bInstance, valueChangedEvent, obj, ownProp, superScope) {
  const origSetAdd = obj.add;
  const setAddFct = proxy => function(value) {
    if (!obj.has(value)) {
      const old = new Set(obj.values());
      const ret = origSetAdd.call(obj, value);
      valueChangedEvent(superScope, ownProp, old, obj);
      return ret;
    } else {
      return origSetAdd.call(obj, value);
    }
  }
  const origSetClear = obj.clear;
  const mapClearFct = proxy => function() {
    if (obj.size) {
      const old = new Set(obj.values());
      const ret = origSetClear.call(obj);
      valueChangedEvent(superScope, ownProp, old, obj);
      return ret;
    } else {
      return origSetClear.call(obj);
    }
  };
  const origSetDelete = obj.delete;
  const mapDeleteFct = proxy => function(value) {
    if (obj.has(value)) {
      const old = new Set(obj.values());
      const ret = origSetDelete.call(obj, value);
      valueChangedEvent(superScope, ownProp, old, obj);
      return ret;
    } else {
      return origSetDelete.call(obj, value);
    }
  };
  const scope = createProxy(obj, {
    has: hasFct(superScope),
    get: getFct(bInstance, superScope, ownProp, null, (target, prop, receiver) => {
      if (prop == 'add') {
        return setAddFct(receiver);
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
    }),
  });
  return scope;
}
