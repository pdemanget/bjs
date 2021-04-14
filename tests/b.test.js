import {jest, test, expect, beforeEach, afterEach} from '@jest/globals';
const mockProxy = jest.mock('../src/proxy.js');
const mockExpr = jest.mock('../src/expr.js');
const mockFilters = jest.mock('../src/filters.js');
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
  // TODO
});

test("Bjs createWatchers", () => {
  const b = instBjs();
  // TODO
});

test("Bjs valueChangedEvent", () => {
  const b = instBjs();
  // TODO
});

test("Bjs escapeRegex", () => {
  const b = instBjs();
  expect(b.escapeRegex('$index')).toEqual('\\$index');
  expect(b.escapeRegex('$super.$value')).toEqual('\\$super\\.\\$value');
});

test("Bjs setBoundValues", () => {
  const b = instBjs();
  // TODO
});

test("Bjs createTemplates", () => {
  const b = instBjs();
  // TODO
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
