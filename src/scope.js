import {
  IS_PROXY_ATTR,
} from "./proxy.js";
import {
  createArrayProxy,
} from "./scope_array.js";
import {
  createMapProxy,
} from "./scope_map.js";
import {
  createSetProxy,
} from "./scope_set.js";
import {
  createObjectProxy,
} from "./scope_object.js";

/**
 * valueChangedEvent takes: (scope, domElement, property, old_value | undefined, new_value | undefined)
 */
export function createScope(bInstance, domElement, valueChangedEvent, initial, ownProp, superScope) {
  return createRecursiveScope(bInstance, domElement, valueChangedEvent, initial || {}, ownProp || null, superScope || null);
}

export function createRecursiveScope(bInstance, domElement, valueChangedEvent, obj, ownProp, superScope) {
  if (obj !== null && typeof obj == "object") {
    if (obj[IS_PROXY_ATTR]) { // value is already proxified
      return obj;
    }
    if (isNotProcessedObject(obj)) {
      return obj;
    } else if (obj instanceof Array) {
      return createArrayProxy(bInstance, valueChangedEvent, obj, ownProp, superScope, createRecursiveScope);
    } else if (obj instanceof Map) {
      return createMapProxy(bInstance, valueChangedEvent, obj, ownProp, superScope, createRecursiveScope);
    } else if (obj instanceof Set) {
      return createSetProxy(bInstance, valueChangedEvent, obj, ownProp, superScope, createRecursiveScope);
    } else {
      return createObjectProxy(bInstance, valueChangedEvent, obj, ownProp, superScope, domElement, createRecursiveScope);
    }
  } else { // value is not an object
    return obj;
  }
}

const notProcessedObjects = [
  Error,
  ArrayBuffer,
  DataView,
  Promise,
];

export const isNotProcessedObject = obj => {
  let ret = false;
  for (const npObj of notProcessedObjects) {
    if (obj instanceof npObj) {
      ret = true;
      break;
    }
  }
  return ret;
}
