import {jest, test, expect, beforeEach, afterEach} from '@jest/globals';
import {isProxyAttr} from '../src/proxy.js';
import Bjs from "../src/b.js";

function instBjs(scope, watchers, templates) {
  class CustomEvent {
    constructor(typeArg, customEventInit) {
      this.typeArg = typeArg;
      this.customEventInit = customEventInit || {};
      this.detail = this.customEventInit.detail || null;
    }
  }
  global.CustomEvent = CustomEvent;
  jest.spyOn(Bjs.prototype, 'createScope').mockImplementation(() => scope || {});
  jest.spyOn(Bjs.prototype, 'createWatchers').mockImplementation(() => watchers || {});
  jest.spyOn(Bjs.prototype, 'createTemplates').mockImplementation(() => templates || []);
  jest.spyOn(Bjs.prototype, 'evaluateTemplates').mockImplementation(() => undefined);
  jest.spyOn(Bjs.prototype, 'findBinds').mockImplementation(() => undefined);
  const doc = {
    dispatchEvent: jest.fn(),
  };
  const b = new Bjs(doc);
  jest.restoreAllMocks();
  expect(b.doc).toBe(doc);
  return b;
}

test("Bjs", () => {
  expect(typeof Bjs).toBe('function');
  expect(Bjs instanceof Object).toBe(true);
  expect(Bjs.name).toEqual('Bjs');
  expect(Object.getOwnPropertyNames(Bjs.prototype).sort()).toEqual([
    'constructor',
    'superAttr',
    'instAttr',
    'createScope',
    'createWatchers',
    'valueChangedEvent',
    'escapeRegex',
    'setBoundValues',
    'createTemplates',
    'evaluateTemplates',
    'evaluateTemplate',
    'renderTemplateBif',
    'renderTemplateBfor',
    'findBinds',
    'findVarExprs',
    'addBind',
    'getBindValue',
  ].sort());
});

test("Bjs constructor", () => {
  const scope = {};
  const watchers = {};
  const templates = [];
  const b = instBjs(scope, watchers, templates);
  expect(b.scope).toBe(scope);
  expect(b.watchers).toBe(watchers);
  expect([...b.filters.keys()]).toEqual([
    'add',
    'upper',
    'lower',
    'capitalize',
    'trim',
  ]);
  expect(b.doc.dispatchEvent).toHaveBeenCalledWith(expect.any(CustomEvent));
  const triggeredEvent = b.doc.dispatchEvent.mock.calls[0][0];
  expect(triggeredEvent.typeArg).toEqual('bready');
  expect(triggeredEvent.detail).toBe(b);
});

test("Bjs createScope", () => {
  const b = instBjs();
  const superAttr = b.superAttr;
  const instAttr = b.instAttr;
  b.valueChangedEvent = jest.fn();
  let origScope = {
    '$index': 2,
    '$value': 'test',
  };
  let superScope = {
    'country': 'France',
    [superAttr]: null,
  };
  let scope = b.createScope(origScope, superScope);
  expect(isProxyAttr in scope).toBe(false);
  expect('$value' in scope).toBe(true);
  expect(instAttr in scope).toBe(true);
  expect(superAttr in scope).toBe(true);
  expect('country' in scope).toBe(true);
  expect('nonexistant' in scope).toBe(false);
  expect(scope[isProxyAttr]).toBe(true);
  expect(scope['$value']).toEqual('test');
  expect(scope[instAttr]).toBe(b);
  expect(scope[superAttr]).toBe(superScope);
  expect(scope['country']).toEqual('France');
  expect(scope['nonexistant']).toBeUndefined();
  scope.toto = 'titi';
  expect('toto' in scope).toBe(true);
  expect(scope['toto']).toEqual('titi');
  expect(origScope['toto']).toEqual('titi');
  expect(Object.keys(scope).sort()).toEqual([
    '$index',
    '$value',
    'toto',
  ].sort());
  expect(Object.entries(scope).sort()).toEqual([
    ['$index', 2],
    ['$value', 'test'],
    ['toto', 'titi'],
  ].sort());
  expect(b.valueChangedEvent).toHaveBeenCalledWith('toto', undefined, 'titi');
  b.valueChangedEvent.mockClear();
  const totoValueObj = {
    any: 'prop',
  };
  scope.toto = totoValueObj;
  expect(b.valueChangedEvent).toHaveBeenCalledWith('toto', 'titi', totoValueObj);
  b.valueChangedEvent.mockClear();
  scope.toto = 'changed';
  expect(b.valueChangedEvent).toHaveBeenCalledWith('toto', totoValueObj, 'changed');
  expect(b.valueChangedEvent.mock.calls[0][1]).not.toBe(totoValueObj);
  b.valueChangedEvent.mockClear();
  scope.toto = 'changed';
  expect(b.valueChangedEvent).not.toHaveBeenCalled();
  scope.toto = totoValueObj;
  b.valueChangedEvent.mockClear();
  delete scope.toto;
  expect('toto' in scope).toBe(false);
  expect('toto' in origScope).toBe(false);
  expect(b.valueChangedEvent).toHaveBeenCalledWith('toto', totoValueObj);
  expect(b.valueChangedEvent.mock.calls[0][1]).not.toBe(totoValueObj);
  b.valueChangedEvent.mockClear();
  // second test with empty scope and super
  scope = b.createScope();
  expect(Object.keys(scope).length).toEqual(0);
  scope.toto = 'titi';
  expect(isProxyAttr in scope).toBe(false);
  expect('toto' in scope).toBe(true);
  expect(instAttr in scope).toBe(true);
  expect(superAttr in scope).toBe(false);
  expect('country' in scope).toBe(false);
  expect('nonexistant' in scope).toBe(false);
  expect(scope[isProxyAttr]).toBe(true);
  expect(scope['toto']).toEqual('titi');
  expect(scope[instAttr]).toBe(b);
  expect(scope[superAttr]).toBeUndefined();
  expect(scope['country']).toBeUndefined();
  expect(scope['nonexistant']).toBeUndefined();
});

test("Bjs createWatchers", () => {
  const b = instBjs();
  let watchers = b.createWatchers();
  expect(Object.keys(watchers).length).toEqual(0);
  expect(watchers[isProxyAttr]).toBe(true);
  let countryWatchers = watchers['country'];
  expect(Object.keys(watchers).length).toEqual(1);
  expect(countryWatchers).toEqual([]);
  watchers['zone'].push('a watcher');
  expect(watchers['zone']).toEqual(['a watcher']);
});

test("Bjs valueChangedEvent", () => {
  const b = instBjs();
  b.watchers = {
    'country': [
      jest.fn(),
      jest.fn(),
    ],
    'other': [
      jest.fn(),
    ],
  };
  b.evaluateTemplates = jest.fn();
  b.setBoundValues = jest.fn();
  b.valueChangedEvent('country', 'old value', 'new value');
  expect(b.watchers['country'][0]).toHaveBeenCalledWith('new value', 'old value');
  expect(b.watchers['country'][1]).toHaveBeenCalledWith('new value', 'old value');
  expect(b.watchers['other'][0]).not.toHaveBeenCalled();
  expect(b.evaluateTemplates).toHaveBeenCalled();
  expect(b.setBoundValues).toHaveBeenCalledWith('country', b.scope, b.doc);
  b.watchers['country'][0].mockClear();
  b.watchers['country'][1].mockClear();
  b.watchers['other'][0].mockClear();
  b.evaluateTemplates.mockClear();
  b.setBoundValues.mockClear();
});

test("Bjs escapeRegex", () => {
  const b = instBjs();
  expect(b.escapeRegex('$index')).toEqual('\\$index');
  expect(b.escapeRegex('$super.$value')).toEqual('\\$super\\.\\$value');
});

test("Bjs setBoundValues", () => {
  const b = instBjs();
  global.console.debug = jest.fn();
  b.escapeRegex = jest.fn(name => name);
  let scope = {
    toto: 'titi',
    foo: {
      bar: 'baz',
    },
    [b.instAttr]: b,
  }
  let elts = [
    {
      getAttribute: arg => (arg == 'bbind') ? 'toto' : undefined,
      type: 'text',
      value: 'old',
      innerText: 'old text',
    },
    {
      getAttribute: arg => (arg == 'bbind') ? 'totour' : undefined,
      type: 'text',
      value: 'Old',
      innerText: 'Old text',
    },
    {
      getAttribute: arg => (arg == 'bval') ? 'toto|upper' : undefined,
      innerText: 'tutu',
    },
  ];
  const rootElt = {
    querySelectorAll: jest.fn(),
  }
  rootElt.querySelectorAll.mockReturnValue(elts),
  b.setBoundValues('toto', scope, rootElt);
  expect(rootElt.querySelectorAll).toHaveBeenCalledWith('* [bval^="toto"], * [bbind^="toto"]');
  expect(elts[0]['value']).toEqual('titi');
  expect(elts[0]['innerText']).toEqual('old text');
  expect(elts[1]['value']).toEqual('Old');
  expect(elts[1]['innerText']).toEqual('Old text');
  expect(elts[2]['value']).toBeUndefined();
  expect(elts[2]['innerText']).toEqual('TITI');
  rootElt.querySelectorAll.mockClear();
  delete scope.toto;
  b.setBoundValues('toto', scope, rootElt);
  expect(rootElt.querySelectorAll).toHaveBeenCalledWith('* [bval^="toto"], * [bbind^="toto"]');
  expect(elts[0]['value']).toEqual('');
  expect(elts[0]['innerText']).toEqual('old text');
  expect(elts[1]['value']).toEqual('Old');
  expect(elts[1]['innerText']).toEqual('Old text');
  expect(elts[2]['value']).toBeUndefined();
  expect(elts[2]['innerText']).toEqual('');
  rootElt.querySelectorAll.mockClear();
  elts = [
    {
      getAttribute: arg => (arg == 'bbind') ? 'foo' : undefined,
      type: 'text',
      value: 'old',
      innerText: 'old text',
    },
    {
      getAttribute: arg => (arg == 'bbind') ? 'foo.bar|capitalize' : undefined,
      type: 'text',
      value: 'Old',
      innerText: 'Old text',
    },
    {
      getAttribute: arg => (arg == 'bval') ? "foo['bar']|capitalize" : undefined,
      innerText: 'tutu',
    },
  ];
  rootElt.querySelectorAll.mockReturnValue(elts),
  b.setBoundValues('foo', scope, rootElt);
  expect(rootElt.querySelectorAll).toHaveBeenCalledWith('* [bval^="foo"], * [bbind^="foo"]');
  expect(elts[0]['value']).toBe(scope.foo);
  expect(elts[0]['innerText']).toEqual('old text');
  expect(elts[1]['value']).toEqual('Baz');
  expect(elts[1]['innerText']).toEqual('Old text');
  expect(elts[2]['value']).toBeUndefined();
  expect(elts[2]['innerText']).toEqual('Baz');
});

test("Bjs createTemplates", () => {
  const b = instBjs();
  let elts = [
    {
      cloneNode: jest.fn().mockReturnThis(),
      hasAttribute: arg => arg == 'bif',
      getAttribute: arg => (arg == 'bif') ? 'countries' : undefined,
      removeAttribute: jest.fn(),
      parentElement: {
        replaceChild: jest.fn(),
      },
    },
    {
      cloneNode: jest.fn().mockReturnThis(),
      hasAttribute: arg => arg == 'bfor',
      getAttribute: arg => (arg == 'bfor') ? 'countries' : undefined,
      removeAttribute: jest.fn(),
      parentElement: {
        replaceChild: jest.fn(),
      },
    },
  ];
  b.doc.querySelectorAll = jest.fn().mockReturnValue(elts);
  b.doc.createElement = jest.fn();
  let mockTemplates = [
    { // bfor
      setAttribute: jest.fn(),
      content: {
        appendChild: jest.fn(),
      },
      isConnected: false,
    },
    { // bif
      setAttribute: jest.fn(),
      content: {
        appendChild: jest.fn(),
      },
      isConnected: true,
    },
  ];
  b.doc.createElement.mockReturnValueOnce(mockTemplates[0]);
  b.doc.createElement.mockReturnValueOnce(mockTemplates[1]);
  expect(b.createTemplates()).toEqual([
    mockTemplates[1],
  ]);
  expect(b.doc.querySelectorAll).toHaveBeenCalledWith('* [bif], * [bfor]');
  expect(elts[0].cloneNode).toHaveBeenCalledWith(true);
  expect(elts[1].cloneNode).toHaveBeenCalledWith(true);
  expect(b.doc.createElement).toHaveBeenCalledTimes(2);
  expect(b.doc.createElement).toHaveBeenCalledWith('template');
  expect(elts[0].removeAttribute).toHaveBeenCalledTimes(1);
  expect(elts[0].removeAttribute).toHaveBeenCalledWith('bif');
  expect(elts[1].removeAttribute).toHaveBeenCalledTimes(1);
  expect(elts[1].removeAttribute).toHaveBeenCalledWith('bfor');
  expect(elts[0].parentElement.replaceChild).toHaveBeenCalledTimes(1);
  expect(elts[0].parentElement.replaceChild).toHaveBeenCalledWith(mockTemplates[1], elts[0]);
  expect(elts[1].parentElement.replaceChild).toHaveBeenCalledTimes(1);
  expect(elts[1].parentElement.replaceChild).toHaveBeenCalledWith(mockTemplates[0], elts[1]);
  expect(mockTemplates[0].setAttribute).toHaveBeenCalledTimes(3);
  expect(mockTemplates[0].setAttribute).toHaveBeenCalledWith('type', 'bjs');
  expect(mockTemplates[0].setAttribute).toHaveBeenCalledWith('directive', 'bfor');
  expect(mockTemplates[0].setAttribute).toHaveBeenCalledWith('expr', 'countries');
  expect(mockTemplates[0].content.appendChild).toHaveBeenCalledWith(elts[1]);
  expect(mockTemplates[0].nbElts).toEqual(0);
  expect(mockTemplates[1].setAttribute).toHaveBeenCalledTimes(3);
  expect(mockTemplates[1].setAttribute).toHaveBeenCalledWith('type', 'bjs');
  expect(mockTemplates[1].setAttribute).toHaveBeenCalledWith('directive', 'bif');
  expect(mockTemplates[1].setAttribute).toHaveBeenCalledWith('expr', 'countries');
  expect(mockTemplates[1].content.appendChild).toHaveBeenCalledWith(elts[0]);
  expect(mockTemplates[1].nbElts).toEqual(0);
});

test("Bjs evaluateTemplates", () => {
  const b = instBjs();
  b.scope = {
    toto: 'titi',
  };
  b._templates = [
    'template1',
    'template2',
  ];
  b.evaluateTemplate = jest.fn();
  b.evaluateTemplates();
  expect(b.evaluateTemplate).toHaveBeenCalledTimes(2);
  expect(b.evaluateTemplate).toHaveBeenCalledWith('template1', b.scope);
  expect(b.evaluateTemplate).toHaveBeenCalledWith('template2', b.scope);
});

test("Bjs evaluateTemplate", () => {
  const b = instBjs();
  // TODO
});

test("Bjs renderTemplateBif", () => {
  const b = instBjs();
  // TODO
});

test("Bjs renderTemplateBfor", () => {
  const b = instBjs();
  // TODO
});

test("Bjs findBinds", () => {
  const b = instBjs();
  b.addBind = jest.fn();
  let elts = [
    {
      getAttribute: arg => (arg == 'bval') ? 'tutu' : undefined,
    },
    {
      getAttribute: arg => undefined,
    },
    {
      getAttribute: arg => (arg == 'bbind') ? 'toto' : undefined,
    },
    {
      getAttribute: arg => (arg == 'bbind') ? '' : undefined,
    },
    {
      getAttribute: arg => (arg == 'bbind') ? 'tata' : undefined,
    },
  ];
  b.doc.querySelectorAll = jest.fn().mockReturnValue(elts);
  b.findBinds();
  expect(b.doc.querySelectorAll).toHaveBeenCalledWith("* [bbind]");
  expect(b.addBind).toHaveBeenCalledTimes(2);
  expect(b.addBind).toHaveBeenCalledWith(elts[2], 'toto');
  expect(b.addBind).toHaveBeenCalledWith(elts[4], 'tata');
  b.addBind.mockClear();
  elts = [
    {
      getAttribute: arg => (arg == 'bbind') ? 'toto' : undefined,
    },
    {
      getAttribute: arg => (arg == 'bbind') ? 'tata.tutu' : undefined,
    },
  ];
  b.doc.querySelectorAll = jest.fn().mockReturnValue(elts);
  expect(() => {
    b.findBinds();
  }).toThrowError("tata.tutu expression is forbidden in bbind, you can only use raw variable name");
  expect(b.addBind).toHaveBeenCalledTimes(1);
  expect(b.addBind).toHaveBeenCalledWith(elts[0], 'toto');
  b.addBind.mockClear();
  elts = [
    {
      getAttribute: arg => (arg == 'bbind') ? 'toto' : undefined,
    },
    {
      getAttribute: arg => (arg == 'bbind') ? 'tata[tutu]' : undefined,
    },
  ];
  b.doc.querySelectorAll = jest.fn().mockReturnValue(elts);
  expect(() => {
    b.findBinds();
  }).toThrowError("tata[tutu] expression is forbidden in bbind, you can only use raw variable name");
  expect(b.addBind).toHaveBeenCalledTimes(1);
  expect(b.addBind).toHaveBeenCalledWith(elts[0], 'toto');
});

test("Bjs findVarExprs", () => {
  const b = instBjs();
  const elts = [
    {
      getAttribute: arg => (arg == 'bval') ? 'tutu' : undefined,
    },
    {
      getAttribute: arg => undefined,
    },
    {
      getAttribute: arg => '',
    },
    {
      getAttribute: arg => (arg == 'bval') ? 'toto.titi' : undefined,
    },
    {
      getAttribute: arg => (arg == 'bbind') ? 'tutu' : undefined,
    },
  ];
  const rootElt = {
    querySelectorAll: jest.fn().mockReturnValue(elts),
  };
  expect(b.findVarExprs(rootElt).sort()).toEqual([
    'tutu',
    'toto.titi',
  ].sort());
  expect(rootElt.querySelectorAll).toHaveBeenCalledWith("* [bval], * [bbind]");
});

test("Bjs addBind", () => {
  const b = instBjs();
  let elt = {
    type: "input",
    value: "text",
    innerText: "some text",
    addEventListener: jest.fn(),
  };
  b.addBind(elt, 'toto');
  expect('toto' in b.scope).toBe(true);
  expect(b.scope.toto).toEqual("text");
  expect(elt.bKeyupEvent).toBeDefined();
  expect(elt.addEventListener).toHaveBeenCalledWith('keyup', elt.bKeyupEvent);
});

test("Bjs getBindValue", () => {
  const b = instBjs();
  let elt = {
    type: "input",
    value: "text",
    innerText: "some text",
  }
  expect(b.getBindValue(elt)).toEqual("text");
  elt = {
    type: "input",
    innerText: "some text",
  }
  expect(b.getBindValue(elt)).toBeUndefined();
  elt = {
    innerText: "some text",
  }
  expect(b.getBindValue(elt)).toEqual("some text");
});
