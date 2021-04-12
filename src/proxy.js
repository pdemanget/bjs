export const isProxyAttr = '__isProxy';

export function proxyHasFunction($obj, target, prop) {
  return prop in $obj;
}

export function proxyGetFunction($obj, target, prop, receiver) {
  if (prop == isProxyAttr) {
    return true;
  } else {
    return $obj[prop];
  }
}

export function proxySetFunction($obj, target, prop, value, receiver) {
  $obj[prop] = value;
  return true;
}

export function proxyDeletePropertyFunction($obj, target, prop) {
  if (prop in $obj) {
    delete $obj[prop];
  }
  return true;
}

export function proxyOwnKeyFunction($obj, target) {
  return Object.keys($obj);
}

export function proxyGetOwnPropertyDescriptorFunction($obj, target, prop) {
  if (prop in $obj) {
    return {
      enumerable: true,
      configurable: true,
      value: $obj[prop],
    };
  }
}

export function createProxy(obj, overrides) {
  const $obj = obj || {};
  const handler = Object.assign({
    has(target, prop) {
      return proxyHasFunction($obj, target, prop);
    },
    get(target, prop, receiver) {
      return proxyGetFunction($obj, target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      return proxySetFunction($obj, target, prop, value, receiver);
    },
    deleteProperty(target, prop) {
      return proxyDeletePropertyFunction($obj, target, prop);
    },
    ownKeys(target) {
      return proxyOwnKeyFunction($obj, target);
    },
    getOwnPropertyDescriptor(target, prop) {
      return proxyGetOwnPropertyDescriptorFunction($obj, target, prop);
    },
  }, overrides || {});
  return new Proxy({}, handler);
}

export function setObjectPropValue(obj, prop, value, valueChangedEvent) {
  let finalValue;
  if (typeof value == "object") {
    if (value[isProxyAttr]) {
      // value is already proxified
      finalValue = value;
    } else {
      finalValue = createProxy(value, {
        set(subtarget, subprop, subvalue, subreceiver) {
          return setObjectPropValue(value, subprop, subvalue, valueChangedEvent);
        },
        deleteProperty(subtarget, subprop) {
          return deleteObjectProp(value, subprop, valueChangedEvent);
        },
      });
    }
  } else {
    // no need to proxy
    finalValue = value;
  }
  const old = obj[prop];
  if (old != finalValue) {
    obj[prop] = finalValue;
    valueChangedEvent(prop, old, finalValue);
  }
  return true;
}

export function deleteObjectProp(obj, prop, valueChangedEvent) {
  if (prop in obj) {
    const old = obj[prop];
    valueChangedEvent(prop, old);
    delete obj[prop];
  }
  return true;
}
