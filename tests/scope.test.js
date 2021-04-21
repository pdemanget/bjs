import {jest, test, expect, beforeEach, afterEach} from '@jest/globals';
import {
  IS_PROXY_ATTR,
} from "../src/proxy.js";
import {
  INST_ATTR,
  EL_ATTR,
  SUPER_ATTR,
  SCOPE_NAME_ATTR,
} from "../src/scope_common.js";
import {createScope} from "../src/scope.js";

test("createScope with empty everything", async () => {
  const b = {'b': 'B'};
  const domElement = {'querySelectorAll': 'Q'};
  const valueChangedEvent = jest.fn();
  const scope = createScope(b, domElement, valueChangedEvent);
  expect(!!scope).toBe(true);
  expect(scope[IS_PROXY_ATTR]).toBe(true);
  expect(scope[INST_ATTR]).toBe(b);
  expect(scope[EL_ATTR]).toBe(domElement);
  expect(scope[SUPER_ATTR]).toBe(null);
  expect(scope[SCOPE_NAME_ATTR]).toBe(null);
  expect(Object.entries(scope)).toEqual([]);
  expect(IS_PROXY_ATTR in scope).toBe(true);
  expect(INST_ATTR in scope).toBe(true);
  expect(EL_ATTR in scope).toBe(true);
  expect(SUPER_ATTR in scope).toBe(false);
  expect(SCOPE_NAME_ATTR in scope).toBe(true);
});

test("createScope with standard object", async () => {
  const b = {'b': 'B'};
  const domElement = {'querySelectorAll': 'Q'};
  const valueChangedEvent = jest.fn();
  const obj = {
    'toto': 'TOTO',
  };
  const prop = 's';
  const superScope = {
    [IS_PROXY_ATTR]: true,
    [INST_ATTR]: b,
    [EL_ATTR]: domElement,
    [SUPER_ATTR]: null,
    [SCOPE_NAME_ATTR]: null,
    [prop]: obj,
  };
  const scope = createScope(b, domElement, valueChangedEvent, obj, prop, superScope);
  expect(!!scope).toBe(true);
  expect(scope[IS_PROXY_ATTR]).toBe(true);
  expect(scope[INST_ATTR]).toBe(b);
  expect(scope[EL_ATTR]).toBe(domElement);
  expect(scope[SUPER_ATTR]).toBe(superScope);
  expect(scope[SCOPE_NAME_ATTR]).toEqual('s');
  expect(Object.entries(scope)).toEqual(Object.entries(obj));
  expect(scope).not.toBe(obj);
  expect(IS_PROXY_ATTR in scope).toBe(true);
  expect(INST_ATTR in scope).toBe(true);
  expect(EL_ATTR in scope).toBe(true);
  expect(SUPER_ATTR in scope).toBe(true);
  expect(SCOPE_NAME_ATTR in scope).toBe(true);
  expect('toto' in scope).toBe(true);
  expect('tutu' in scope).toBe(false);
  expect(scope.toto).toEqual('TOTO');
  expect(scope.tutu).toBeUndefined();
  expect(valueChangedEvent).not.toHaveBeenCalled();
  scope.truc = {
    'machin': 'chose',
  };
  expect(IS_PROXY_ATTR in scope.truc).toBe(true);
  expect(Object.entries(scope.truc)).toEqual([['machin', 'chose']]);
  expect(Object.entries(scope.truc)).toEqual(Object.entries(obj.truc));
  expect(valueChangedEvent).toHaveBeenCalledWith(scope, 'truc', undefined, scope.truc);
  valueChangedEvent.mockClear();
  delete scope.truc.machin;
  expect(Object.entries(scope.truc)).toEqual([]);
  expect(Object.entries(obj.truc)).toEqual([]);
  expect(valueChangedEvent).toHaveBeenCalledWith(scope.truc, 'machin', 'chose');
});

test("createScope with standard array", async () => {
  const b = {'b': 'B'};
  const domElement = {'querySelectorAll': 'Q'};
  const valueChangedEvent = jest.fn();
  const obj = ['toto'];
  const prop = 's';
  const superScope = {
    [IS_PROXY_ATTR]: true,
    [INST_ATTR]: b,
    [EL_ATTR]: domElement,
    [SUPER_ATTR]: null,
    [SCOPE_NAME_ATTR]: null,
    [prop]: obj,
  };
  const scope = createScope(b, domElement, valueChangedEvent, obj, prop, superScope);
  expect(!!scope).toBe(true);
  expect(scope[IS_PROXY_ATTR]).toBe(true);
  expect(scope[INST_ATTR]).toBe(b);
  expect(scope[EL_ATTR]).toBe(domElement);
  expect(scope[SUPER_ATTR]).toBe(superScope);
  expect(scope[SCOPE_NAME_ATTR]).toEqual('s');
  expect(Object.entries(scope)).toEqual(Object.entries(obj));
  expect(Object.entries(scope)).toEqual([['0', 'toto']]);
  expect(scope instanceof Array).toBe(true);
  expect(scope).not.toBe(obj);
  expect(IS_PROXY_ATTR in scope).toBe(true);
  expect(INST_ATTR in scope).toBe(true);
  expect(EL_ATTR in scope).toBe(true);
  expect(SUPER_ATTR in scope).toBe(true);
  expect(SCOPE_NAME_ATTR in scope).toBe(true);
  expect(scope.length).toEqual(1);
  expect(scope.includes('toto')).toBe(true);
  expect(scope.includes('tutu')).toBe(false);
  expect(valueChangedEvent).not.toHaveBeenCalled();
  valueChangedEvent.mockClear();
  scope.push('start');
  expect(scope).toEqual(['toto', 'start']);
  expect(obj).toEqual(['toto', 'start']);
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', ['toto'], ['toto', 'start']);
  valueChangedEvent.mockClear();
  scope.pop();
  expect(scope).toEqual(['toto']);
  expect(obj).toEqual(['toto']);
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', ['toto', 'start'], ['toto']);
  valueChangedEvent.mockClear();
  scope.unshift('atStart');
  expect(scope).toEqual(['atStart', 'toto']);
  expect(obj).toEqual(['atStart', 'toto']);
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', ['toto'], ['atStart', 'toto']);
  valueChangedEvent.mockClear();
  scope.shift();
  expect(scope).toEqual(['toto']);
  expect(obj).toEqual(['toto']);
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', ['atStart', 'toto'], ['toto']);
  scope.push('titi');
  valueChangedEvent.mockClear();
  scope.fill('collins', 0, 8);
  expect(scope).toEqual(['collins', 'collins']);
  expect(obj).toEqual(['collins', 'collins']);
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', ['toto', 'titi'], ['collins', 'collins']);
  valueChangedEvent.mockClear();
  scope.splice(1, 1, 'linus', 'torvalds');
  expect(scope).toEqual(['collins', 'linus', 'torvalds']);
  expect(obj).toEqual(['collins', 'linus', 'torvalds']);
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', ['collins', 'collins'], ['collins', 'linus', 'torvalds']);
  valueChangedEvent.mockClear();
  scope.reverse();
  expect(scope).toEqual(['torvalds', 'linus', 'collins']);
  expect(obj).toEqual(['torvalds', 'linus', 'collins']);
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', ['collins', 'linus', 'torvalds'], ['torvalds', 'linus', 'collins']);
  valueChangedEvent.mockClear();
  scope.sort();
  expect(scope).toEqual(['collins', 'linus', 'torvalds']);
  expect(obj).toEqual(['collins', 'linus', 'torvalds']);
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', ['torvalds', 'linus', 'collins'], ['collins', 'linus', 'torvalds']);
  valueChangedEvent.mockClear();
  scope.length = 2;
  expect(scope).toEqual(['collins', 'linus']);
  expect(obj).toEqual(['collins', 'linus']);
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', ['collins', 'linus', 'torvalds'], ['collins', 'linus']);
  valueChangedEvent.mockClear();
  scope[1] = 'phil';
  expect(scope).toEqual(['collins', 'phil']);
  expect(obj).toEqual(['collins', 'phil']);
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', ['collins', 'linus'], ['collins', 'phil']);
  valueChangedEvent.mockClear();
  delete scope[1];
  expect(scope).toEqual(['collins', undefined]);
  expect(obj).toEqual(['collins', undefined]);
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', ['collins', 'phil'], ['collins', undefined]);
});

test("createScope with standard map", async () => {
  const b = {'b': 'B'};
  const domElement = {'querySelectorAll': 'Q'};
  const valueChangedEvent = jest.fn();
  const obj = new Map([['toto', 'TOTO']]);
  const prop = 's';
  const superScope = {
    [IS_PROXY_ATTR]: true,
    [INST_ATTR]: b,
    [EL_ATTR]: domElement,
    [SUPER_ATTR]: null,
    [SCOPE_NAME_ATTR]: null,
    [prop]: obj,
  };
  const scope = createScope(b, domElement, valueChangedEvent, obj, prop, superScope);
  expect(!!scope).toBe(true);
  expect(scope[IS_PROXY_ATTR]).toBe(true);
  expect(scope[INST_ATTR]).toBe(b);
  expect(scope[EL_ATTR]).toBe(domElement);
  expect(scope[SUPER_ATTR]).toBe(superScope);
  expect(scope[SCOPE_NAME_ATTR]).toEqual('s');
  expect([...scope.entries()]).toEqual([...obj.entries()]);
  expect([...scope.entries()]).toEqual([['toto', 'TOTO']]);
  expect(scope instanceof Map).toBe(true);
  expect(scope).not.toBe(obj);
  expect(IS_PROXY_ATTR in scope).toBe(true);
  expect(INST_ATTR in scope).toBe(true);
  expect(EL_ATTR in scope).toBe(true);
  expect(SUPER_ATTR in scope).toBe(true);
  expect(SCOPE_NAME_ATTR in scope).toBe(true);
  expect(scope.size).toEqual(1);
  expect(scope.has('toto')).toBe(true);
  expect(scope.has('tutu')).toBe(false);
  expect(valueChangedEvent).not.toHaveBeenCalled();
  valueChangedEvent.mockClear();
  scope.set('toto', 'titi');
  expect(scope.get('toto')).toEqual('titi');
  expect(obj.get('toto')).toEqual('titi');
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', new Map([['toto', 'TOTO']]), new Map([['toto', 'titi']]));
  valueChangedEvent.mockClear();
  scope.set('a', 'b');
  expect(scope.get('a')).toEqual('b');
  expect(obj.get('a')).toEqual('b');
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', new Map([['toto', 'titi']]), new Map([['toto', 'titi'], ['a', 'b']]));
  valueChangedEvent.mockClear();
  scope.delete('a');
  expect(scope.has('a')).toBe(false);
  expect(obj.has('a')).toBe(false);
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', new Map([['toto', 'titi'], ['a', 'b']]), new Map([['toto', 'titi']]));
  valueChangedEvent.mockClear();
  scope.clear();
  expect(scope.size).toEqual(0);
  expect(obj.size).toEqual(0);
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', new Map([['toto', 'titi']]), new Map([]));
});

test("createScope with standard set", async () => {
  const b = {'b': 'B'};
  const domElement = {'querySelectorAll': 'Q'};
  const valueChangedEvent = jest.fn();
  const obj = new Set(['toto']);
  const prop = 's';
  const superScope = {
    [IS_PROXY_ATTR]: true,
    [INST_ATTR]: b,
    [EL_ATTR]: domElement,
    [SUPER_ATTR]: null,
    [SCOPE_NAME_ATTR]: null,
    [prop]: obj,
  };
  const scope = createScope(b, domElement, valueChangedEvent, obj, prop, superScope);
  expect(!!scope).toBe(true);
  expect(scope[IS_PROXY_ATTR]).toBe(true);
  expect(scope[INST_ATTR]).toBe(b);
  expect(scope[EL_ATTR]).toBe(domElement);
  expect(scope[SUPER_ATTR]).toBe(superScope);
  expect(scope[SCOPE_NAME_ATTR]).toEqual('s');
  expect([...scope.values()]).toEqual([...obj.values()]);
  expect([...scope.values()]).toEqual(['toto']);
  expect(scope instanceof Set).toBe(true);
  expect(scope).not.toBe(obj);
  expect(IS_PROXY_ATTR in scope).toBe(true);
  expect(INST_ATTR in scope).toBe(true);
  expect(EL_ATTR in scope).toBe(true);
  expect(SUPER_ATTR in scope).toBe(true);
  expect(SCOPE_NAME_ATTR in scope).toBe(true);
  expect(scope.size).toEqual(1);
  expect(scope.has('toto')).toBe(true);
  expect(scope.has('tutu')).toBe(false);
  expect(valueChangedEvent).not.toHaveBeenCalled();
  valueChangedEvent.mockClear();
  scope.add('toto');
  expect(scope.has('toto')).toBe(true);
  expect(obj.has('toto')).toBe(true);
  expect(valueChangedEvent).not.toHaveBeenCalled();
  valueChangedEvent.mockClear();
  scope.add('titi');
  expect(scope.has('titi')).toBe(true);
  expect(obj.has('titi')).toBe(true);
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', new Set(['toto']), new Set(['toto', 'titi']));
  scope.add('tutu');
  valueChangedEvent.mockClear();
  scope.delete('titi');
  expect(scope.has('titi')).toBe(false);
  expect(obj.has('titi')).toBe(false);
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', new Set(['toto', 'titi', 'tutu']), new Set(['toto', 'tutu']));
  valueChangedEvent.mockClear();
  scope.clear();
  expect(scope.size).toEqual(0);
  expect(obj.size).toEqual(0);
  expect(valueChangedEvent).toHaveBeenCalledWith(superScope, 's', new Set(['toto', 'tutu']), new Set([]));
});
