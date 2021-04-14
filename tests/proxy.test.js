import {jest, test, expect, beforeEach, afterEach} from '@jest/globals';
import {
  isProxyAttr,
  proxyHasFunction,
  proxyGetFunction,
  proxySetFunction,
  proxyDeletePropertyFunction,
  proxyOwnKeyFunction,
  proxyGetOwnPropertyDescriptorFunction,
  createProxy,
  setObjectPropValue,
  deleteObjectProp,
} from "../src/proxy.js";

test("isProxyAttr", () => {
  expect(isProxyAttr.substring(0, 2)).toEqual("__");
});

test("proxyHasFunction", () => {
  const obj = {
    toto: 'test',
  };
  expect(proxyHasFunction(obj, {}, 'toto')).toBe(true);
  expect(proxyHasFunction(obj, {}, 'titi')).toBe(false);
});

test("proxyGetFunction", () => {
  const obj = {
    toto: 'test',
  };
  expect(proxyGetFunction(obj, {}, 'toto', {})).toEqual('test');
  expect(proxyGetFunction(obj, {}, isProxyAttr, {})).toBe(true);
  expect(proxyGetFunction(obj, {}, 'titi', {})).toBeUndefined();
});

test("proxySetFunction", () => {
  const obj = {
    toto: 'test',
  };
  expect(proxySetFunction(obj, {}, 'toto', 'changed', {})).toBe(true);
  expect(proxySetFunction(obj, {}, 'titi', 'new', {})).toBe(true);
  expect(obj.toto).toEqual('changed');
  expect(obj.titi).toEqual('new');
});

test("proxyDeletePropertyFunction", () => {
  const obj = {
    toto: 'test',
    titi: 'other',
  };
  expect(proxyDeletePropertyFunction(obj, {}, 'toto')).toBe(true);
  expect(obj.toto).toBeUndefined();
  expect(obj.titi).toEqual('other');
  expect(proxyDeletePropertyFunction(obj, {}, 'tutu')).toBe(true);
  expect(obj.toto).toBeUndefined();
  expect(obj.titi).toEqual('other');
});

test("proxyOwnKeyFunction", () => {
  const obj = {
    toto: 'test',
    titi: 'other',
  };
  expect(proxyOwnKeyFunction(obj, {})).toEqual(['toto', 'titi']);
});

test("proxyGetOwnPropertyDescriptorFunction", () => {
  const obj = {
    toto: 'test',
    titi: 'other',
  };
  expect(proxyGetOwnPropertyDescriptorFunction(obj, {}, 'toto')).toEqual({
    enumerable: true,
    configurable: true,
    value: 'test',
  });
  expect(proxyGetOwnPropertyDescriptorFunction(obj, {}, 'tutu')).toBeUndefined();
});

test("createProxy", () => {
  const obj = {
    toto: 'test',
    titi: 'other',
  };
  let proxy = createProxy(obj);
  expect('toto' in proxy).toBe(true);
  expect(proxy.toto).toEqual('test');
  proxy.toto = 'changed';
  expect(proxy.toto).toEqual('changed');
  expect(proxy[isProxyAttr]).toBe(true);
  expect(proxy.titi).toEqual('other');
  delete proxy.titi;
  expect('titi' in proxy).toBe(false);
  proxy.titi = 'another';
  expect('titi' in proxy).toBe(true);
  expect(Object.keys(proxy)).toEqual(['toto', 'titi']);
  expect(Object.entries(proxy)).toEqual([
    ['toto', 'changed'],
    ['titi', 'another'],
  ]);
  const overrides = {
    has: jest.fn(),
    get: jest.fn(),
    set: jest.fn().mockReturnValue(true),
    deleteProperty: jest.fn().mockReturnValue(true),
    ownKeys: jest.fn().mockReturnValue(['toto']),
    getOwnPropertyDescriptor: jest.fn(),
  }
  proxy = createProxy(null, overrides);
  'toto' in proxy;
  expect(overrides.has).toHaveBeenCalled();
  proxy.toto;
  expect(overrides.get).toHaveBeenCalled();
  proxy.toto = 'test';
  expect(overrides.set).toHaveBeenCalled();
  delete proxy.toto;
  expect(overrides.deleteProperty).toHaveBeenCalled();
  Object.keys(proxy);
  expect(overrides.ownKeys).toHaveBeenCalled();
  Object.entries(proxy);
  expect(overrides.getOwnPropertyDescriptor).toHaveBeenCalled();
});

test("setObjectPropValue", () => {
  let obj = {
    toto: 'test',
    titi: 'other',
  };
  const valueChangedEvent = jest.fn();
  expect(setObjectPropValue(obj, 'toto', 'changed', valueChangedEvent)).toBe(true);
  expect(obj.toto).toEqual('changed');
  expect(valueChangedEvent).toHaveBeenCalledWith('toto', 'test', 'changed');
  valueChangedEvent.mockClear();
  expect(setObjectPropValue(obj, 'toto', 'changed', valueChangedEvent)).toBe(true);
  expect(obj.toto).toEqual('changed');
  expect(valueChangedEvent).not.toHaveBeenCalled();
  valueChangedEvent.mockClear();
  let newVal = { key: 'val' };
  expect(setObjectPropValue(obj, 'titi', newVal, valueChangedEvent)).toBe(true);
  expect(obj.titi).not.toBe(newVal);
  expect(obj.titi).toEqual(newVal);
  expect(valueChangedEvent).toHaveBeenCalledWith('titi', 'other', obj.titi);
  obj.titi.newAttr = 'value';
  expect(obj.titi.newAttr).toEqual('value');
  expect(newVal.newAttr).toEqual('value');
  delete obj.titi.newAttr;
  expect(obj.titi.newAttr).toBeUndefined();
  expect(newVal.newAttr).toBeUndefined();
  valueChangedEvent.mockClear();
  let newPVal = { key: 'val', [isProxyAttr]: true };
  expect(setObjectPropValue(obj, 'tutu', newPVal, valueChangedEvent)).toBe(true);
  expect(obj.tutu).toBe(newPVal);
  expect(obj.tutu).toEqual(newPVal);
  expect(valueChangedEvent).toHaveBeenCalledWith('tutu', undefined, obj.tutu);
  obj.tutu.newAttr = 'value';
  expect(obj.tutu.newAttr).toEqual('value');
  expect(newPVal.newAttr).toEqual('value');
  delete obj.tutu.newAttr;
  expect(obj.tutu.newAttr).toBeUndefined();
  expect(newPVal.newAttr).toBeUndefined();
});

test("deleteObjectProp", () => {
  let obj = {
    toto: 'test',
    titi: 'other',
  };
  const valueChangedEvent = jest.fn();
  expect(deleteObjectProp(obj, 'toto', valueChangedEvent)).toBe(true);
  expect(obj.toto).toBeUndefined();
  expect(valueChangedEvent).toHaveBeenCalledWith('toto', 'test');
  valueChangedEvent.mockClear();
  expect(deleteObjectProp(obj, 'toto', valueChangedEvent)).toBe(true);
  expect(obj.toto).toBeUndefined();
  expect(valueChangedEvent).not.toHaveBeenCalled();
});
