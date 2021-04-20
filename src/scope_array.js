import {
  createProxy,
} from "./proxy.js";
import {
  hasFct,
  getFct,
} from "./scope_common.js";

export function createArrayProxy(bInstance, valueChangedEvent, obj, ownProp, superScope) {
  const origArrPush = obj.push;
  const arrPushFct = proxy => function(...values) {
    const old = [...obj];
    const ret = origArrPush.apply(obj, values);
    if (values.length) {
      valueChangedEvent(superScope, ownProp, old, obj);
    }
    return ret;
  };
  const origArrUnshift = obj.unshift;
  const arrUnshiftFct = proxy => function(...values) {
    const old = [...obj];
    const ret = origArrUnshift.apply(obj, values);
    if (values.length) {
      valueChangedEvent(superScope, ownProp, old, obj);
    }
    return ret;
  };
  const origArrPop = obj.pop;
  const arrPopFct = proxy => function() {
    const old = [...obj];
    const ret = origArrPop.call(obj);
    if (old.length) {
      valueChangedEvent(superScope, ownProp, old, obj);
    }
    return ret;
  };
  const origArrShift = obj.shift;
  const arrShiftFct = proxy => function() {
    const old = [...obj];
    const ret = origArrShift.call(obj);
    if (old.length) {
      valueChangedEvent(superScope, ownProp, old, obj);
    }
    return ret;
  };
  const origArrFill = obj.fill;
  const arrFillFct = proxy => function(...args) {
    const old = [...obj];
    const ret = origArrFill.apply(obj, args);
    valueChangedEvent(superScope, ownProp, old, obj);
    return ret;
  };
  const origArrSplice = obj.splice;
  const arrSpliceFct = proxy => function(...args) {
    const old = [...obj];
    const ret = origArrSplice.apply(obj, args);
    valueChangedEvent(superScope, ownProp, old, obj);
    return ret;
  };
  const origArrReverse = obj.reverse;
  const arrReverseFct = proxy => function() {
    const old = [...obj];
    const ret = origArrReverse.call(obj);
    valueChangedEvent(superScope, ownProp, old, obj);
    return ret;
  };
  const origArrSort = obj.sort;
  const arrSortFct = proxy => function(...args) {
    const old = [...obj];
    const ret = origArrSort.apply(obj, args);
    valueChangedEvent(superScope, ownProp, old, obj);
    return ret;
  };
  const scope = createProxy(obj, {
    has: hasFct(superScope),
    get: getFct(bInstance, superScope, ownProp, null, (target, prop, receiver) => {
      if (prop == 'push') {
        return arrPushFct(receiver);
      } else if (prop == 'unshift') {
        return arrUnshiftFct(receiver);
      } else if (prop == 'pop') {
        return arrPopFct(receiver);
      } else if (prop == 'shift') {
        return arrShiftFct(receiver);
      } else if (prop == 'fill') {
        return arrFillFct(receiver);
      } else if (prop == 'splice') {
        return arrSpliceFct(receiver);
      } else if (prop == 'reverse') {
        return arrReverseFct(receiver);
      } else if (prop == 'sort') {
        return arrSortFct(receiver);
      } else {
        let value = target[prop];
        if (typeof value == 'function') {
          value = value.bind(target);
        }
        return value;
      }
    }),
    set(target, prop, value, receiver) {
      if (prop == 'length' || !isNaN(1 * prop)) {
        const old = [...obj];
        const oldValue = target[prop];
        target[prop] = value;
        if (oldValue != value) {
          valueChangedEvent(superScope, ownProp, old, obj);
        }
      } else {
        target[prop] = value;
      }
      return true;
    },
    deleteProperty(target, prop) {
      if (!isNaN(1 * prop)) {
        const old = [...obj];
        delete target[prop];
        valueChangedEvent(superScope, ownProp, old, obj);
      } else {
        delete target[prop];
      }
      return true;
    },
  });
  return scope;
}

