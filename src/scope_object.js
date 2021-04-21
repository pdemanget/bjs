import {
  createProxy,
} from "./proxy.js";
import {
  hasFct,
  getFct,
  EL_ATTR,
} from "./scope_common.js";

export function createObjectProxy(bInstance, valueChangedEvent, obj, ownProp, superScope, domElement, createRecursiveScope) {
  let proxy; // defined before to be referenced in deleteProperty as receiver is not available
  proxy = createProxy(obj, {
    has: hasFct(superScope),
    get: getFct(bInstance, superScope, ownProp, domElement),
    set(target, prop, value, receiver) {
      const old = target[prop];
      const proxifiedValue = createRecursiveScope(bInstance, superScope && superScope[EL_ATTR], valueChangedEvent, value, prop, receiver);
      target[prop] = proxifiedValue;
      if (old != proxifiedValue) {
        valueChangedEvent(receiver, prop, old, proxifiedValue);
      }
      return true;
    },
    deleteProperty(target, prop) {
      if (prop in target) {
        const old = target[prop];
        delete target[prop];
        valueChangedEvent(proxy, prop, old);
      } else {
        delete target[prop];
      }
      return true;
    },
  });
  const scope = proxy;
  return scope;
}
