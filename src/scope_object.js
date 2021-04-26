import {
  createScopeProxy,
  EL_ATTR,
} from "./scope_common.js";

export function createObjectProxy(bInstance, valueChangedEvent, obj, ownProp, superScope, domElement, createRecursiveScope) {
  let proxy; // defined before to be referenced in deleteProperty as receiver is not available
  proxy = createScopeProxy(bInstance, superScope, ownProp, domElement, obj, {
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
  for (const [prop, value] of Object.entries(obj)) {
    const proxifiedValue = createRecursiveScope(bInstance, superScope && superScope[EL_ATTR], valueChangedEvent, value, prop, proxy);
    if (value != proxifiedValue) {
      obj[prop] = proxifiedValue;
    }
  }
  return proxy;
}
