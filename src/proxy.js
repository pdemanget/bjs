export const IS_PROXY_ATTR = '$bjs:isProxy';

export function proxyHasFunction(target, prop) {
  return prop in target;
}

export function proxyGetFunction(target, prop, receiver) {
  return target[prop];
}

export function proxySetFunction(target, prop, value, receiver) {
  target[prop] = value;
  return true;
}

export function proxyDeletePropertyFunction(target, prop) {
  if (prop in target) {
    delete target[prop];
  }
  return true;
}

export function proxyOwnKeyFunction(target) {
  return Reflect.ownKeys(target);
}

export function proxyGetOwnPropertyDescriptorFunction(target, prop) {
  return Reflect.getOwnPropertyDescriptor(target, prop);
}

export function proxyToString() {
  return `[Proxy] ${JSON.stringify(this, null, 2)}`;
}

export function createProxy(obj, overrides) {
  const realOverrides = {...(overrides || {})};
  const hasFct = realOverrides.has || proxyHasFunction;
  delete realOverrides.has;
  const getFct = realOverrides.get || proxyGetFunction;
  delete realOverrides.get;
  const toStringFct = realOverrides.toStringFct || proxyToString;
  delete realOverrides.toStringFct;
  const handler = Object.assign({
    has(target, prop) {
      return prop == IS_PROXY_ATTR || prop == 'toString' || hasFct(target, prop);
    },
    get(target, prop, receiver) {
      if (prop == IS_PROXY_ATTR) {
        return true;
      } else if (prop == 'toString') {
        return toStringFct;
      } else {
        let value = getFct(target, prop, receiver);
        if (typeof value == 'function') {
          value = value.bind(target);
        }
        return value;
      }
    },
    set(target, prop, value, receiver) {
      return proxySetFunction(target, prop, value, receiver);
    },
    deleteProperty(target, prop) {
      return proxyDeletePropertyFunction(target, prop);
    },
    ownKeys(target) {
      return proxyOwnKeyFunction(target);
    },
    getOwnPropertyDescriptor(target, prop) {
      return proxyGetOwnPropertyDescriptorFunction(target, prop);
    },
  }, realOverrides);
  return new Proxy(obj || {}, handler);
}
