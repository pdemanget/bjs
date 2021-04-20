import {jest, test, expect, beforeEach, afterEach} from '@jest/globals';
import {
  IS_PROXY_ATTR,
  proxyHasFunction,
  proxyGetFunction,
  proxySetFunction,
  proxyDeletePropertyFunction,
  proxyOwnKeyFunction,
  proxyGetOwnPropertyDescriptorFunction,
  createProxy,
} from "../src/proxy.js";

test("proxyHasFunction", () => {
  const obj = {
    toto: 'test',
  };
  expect(proxyHasFunction(obj, 'toto')).toBe(true);
  expect(proxyHasFunction(obj, 'titi')).toBe(false);
});

test("proxyGetFunction", () => {
  const obj = {
    toto: 'test',
  };
  expect(proxyGetFunction(obj, 'toto', {})).toEqual('test');
  expect(proxyGetFunction(obj, IS_PROXY_ATTR, {})).toBeUndefined();
  expect(proxyGetFunction(obj, 'titi', {})).toBeUndefined();
});

test("proxySetFunction", () => {
  const obj = {
    toto: 'test',
  };
  expect(proxySetFunction(obj, 'toto', 'changed', {})).toBe(true);
  expect(proxySetFunction(obj, 'titi', 'new', {})).toBe(true);
  expect(obj.toto).toEqual('changed');
  expect(obj.titi).toEqual('new');
});

test("proxyDeletePropertyFunction", () => {
  const obj = {
    toto: 'test',
    titi: 'other',
  };
  expect(proxyDeletePropertyFunction(obj, 'toto')).toBe(true);
  expect(obj.toto).toBeUndefined();
  expect(obj.titi).toEqual('other');
  expect(proxyDeletePropertyFunction(obj, 'tutu')).toBe(true);
  expect(obj.toto).toBeUndefined();
  expect(obj.titi).toEqual('other');
});

test("proxyOwnKeyFunction", () => {
  const obj = {
    toto: 'test',
    titi: 'other',
  };
  expect(proxyOwnKeyFunction(obj)).toEqual(['toto', 'titi']);
});

test("proxyGetOwnPropertyDescriptorFunction", () => {
  const obj = {
    toto: 'test',
    titi: 'other',
  };
  expect(proxyGetOwnPropertyDescriptorFunction(obj, 'toto')).toEqual({
    enumerable: true,
    configurable: true,
    value: 'test',
    writable: true,
  });
  expect(proxyGetOwnPropertyDescriptorFunction(obj, 'tutu')).toBeUndefined();
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
  expect(proxy[IS_PROXY_ATTR]).toBe(true);
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
