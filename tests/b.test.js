import {jest, test, expect, beforeEach, afterEach} from '@jest/globals';
import {IS_PROXY_ATTR} from '../src/proxy.js';
import {
  SCOPE_NAME_ATTR,
  SUPER_ATTR,
  INST_ATTR,
  EL_ATTR,
} from "../src/scope_common.js";
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
    querySelectorAll: jest.fn(),
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
    'createScope',
    'createWatchers',
    'valueChangedEvent',
    'triggerWatchers',
    'applyValues',
    'createTemplates',
    'evaluateTemplates',
    'evaluateTemplate',
    'renderTemplateBif',
    'renderTemplateBfor',
    'findBinds',
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
  expect(b.doc.dispatchEvent).toHaveBeenCalledTimes(2);
  expect(b.doc.dispatchEvent).toHaveBeenCalledWith(expect.any(CustomEvent));
  const triggeredBPluginEvent = b.doc.dispatchEvent.mock.calls[0][0];
  const triggeredBReadyEvent = b.doc.dispatchEvent.mock.calls[1][0];
  expect(triggeredBPluginEvent.typeArg).toEqual('bplugin');
  expect(triggeredBPluginEvent.detail).toBe(b);
  expect(triggeredBReadyEvent.typeArg).toEqual('bready');
  expect(triggeredBReadyEvent.detail).toBe(b);
});

test("Bjs createScope", () => {
  const b = instBjs();
  b.valueChangedEvent = jest.fn();
  let domElement = {
    dispatchEvent: jest.fn(),
    querySelectorAll: jest.fn(),
  };
  let origScope = {
    '$index': 2,
    '$value': 'test',
  };
  let superScope = {
    'country': 'France',
    [SUPER_ATTR]: null,
  };
  let scope = b.createScope(domElement, origScope, superScope);
  expect(IS_PROXY_ATTR in scope).toBe(true);
  expect('$value' in scope).toBe(true);
  expect(INST_ATTR in scope).toBe(true);
  expect(SUPER_ATTR in scope).toBe(true);
  expect('country' in scope).toBe(true);
  expect('nonexistant' in scope).toBe(false);
  expect(scope[IS_PROXY_ATTR]).toBe(true);
  expect(scope['$value']).toEqual('test');
  expect(scope[INST_ATTR]).toBe(b);
  expect(scope[SUPER_ATTR]).toBe(superScope);
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
  expect(b.valueChangedEvent).toHaveBeenCalledWith(scope, 'toto', undefined, 'titi');
  b.valueChangedEvent.mockClear();
  const totoValueObj = {
    any: 'prop',
  };
  scope.toto = totoValueObj;
  expect(b.valueChangedEvent).toHaveBeenCalledWith(scope, 'toto', 'titi', totoValueObj);
  b.valueChangedEvent.mockClear();
  scope.toto.any = 'PROP';
  expect(b.valueChangedEvent).toHaveBeenCalledWith(scope.toto, 'any', 'prop', 'PROP');
  b.valueChangedEvent.mockClear();
  scope.toto = 'changed';
  expect(b.valueChangedEvent).toHaveBeenCalledWith(scope, 'toto', totoValueObj, 'changed');
  expect(b.valueChangedEvent.mock.calls[0][2]).not.toBe(totoValueObj);
  b.valueChangedEvent.mockClear();
  scope.toto = 'changed';
  expect(b.valueChangedEvent).not.toHaveBeenCalled();
  scope.toto = totoValueObj;
  b.valueChangedEvent.mockClear();
  delete scope.toto;
  expect('toto' in scope).toBe(false);
  expect('toto' in origScope).toBe(false);
  expect(b.valueChangedEvent).toHaveBeenCalledWith(scope, 'toto', totoValueObj);
  expect(b.valueChangedEvent.mock.calls[0][2]).not.toBe(totoValueObj);
  b.valueChangedEvent.mockClear();
  // second test with empty scope and super
  scope = b.createScope();
  expect(Object.keys(scope).length).toEqual(0);
  scope.toto = 'titi';
  expect(IS_PROXY_ATTR in scope).toBe(true);
  expect('toto' in scope).toBe(true);
  expect(INST_ATTR in scope).toBe(true);
  expect(SUPER_ATTR in scope).toBe(false);
  expect('country' in scope).toBe(false);
  expect('nonexistant' in scope).toBe(false);
  expect(scope[IS_PROXY_ATTR]).toBe(true);
  expect(scope['toto']).toEqual('titi');
  expect(scope[INST_ATTR]).toBe(b);
  expect(scope[SUPER_ATTR]).toBeNull();
  expect(scope['country']).toBeUndefined();
  expect(scope['nonexistant']).toBeUndefined();
});

test("Bjs createWatchers", () => {
  const b = instBjs();
  let watchers = b.createWatchers();
  expect(Object.keys(watchers).length).toEqual(0);
  expect(watchers[IS_PROXY_ATTR]).toBe(true);
  let countryWatchers = watchers['country'];
  expect(Object.keys(watchers).length).toEqual(1);
  expect(countryWatchers).toEqual([]);
  watchers['zone'].push('a watcher');
  expect(watchers['zone']).toEqual(['a watcher']);
});

test("Bjs valueChangedEvent", () => {
  const b = instBjs();
  b.triggerWatchers = jest.fn();
  b.evaluateTemplates = jest.fn();
  b.applyValues = jest.fn();
  const scope = {
    'country': 'France',
  }
  b.valueChangedEvent(scope, 'country', 'Italy', 'France');
  expect(b.triggerWatchers).toHaveBeenCalledWith(scope, 'country', 'Italy', 'France');
  expect(b.evaluateTemplates).toHaveBeenCalled();
  expect(b.applyValues).toHaveBeenCalledWith(scope);
});

test("Bjs triggerWatchers", () => {
  const b = instBjs();
  b.watchers = {
    'a.b.country': [jest.fn()],
    'a.b': [jest.fn()],
    'a': [jest.fn(), jest.fn()],
    'country': [jest.fn()],
  };
  let rootScope = {};
  let superScope = {};
  let scope = {
    'country': 'France',
  };
  const onlyRealProps = obj => {
    return Object.fromEntries(Object.entries(obj).filter(([k, v]) => k[0] != '$').map(([k, v]) => [k, typeof v == 'object' ? onlyRealProps(v) : v]));
  };
  scope[SUPER_ATTR] = superScope;
  scope[SCOPE_NAME_ATTR] = 'b';
  superScope['b'] = scope;
  superScope[SUPER_ATTR] = rootScope;
  superScope[SCOPE_NAME_ATTR] = 'a';
  rootScope['a'] = superScope;
  rootScope[SUPER_ATTR] = null;
  rootScope[SCOPE_NAME_ATTR] = null;
  b.triggerWatchers(scope, 'country', 'Italy', 'France');
  expect(b.watchers['a.b.country'][0]).toHaveBeenCalledWith('France', 'Italy', scope, 'country');
  expect(b.watchers['a.b'][0]).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), superScope, 'b');
  let newBValue = onlyRealProps(b.watchers['a.b'][0].mock.calls[0][0]);
  let oldBValue = onlyRealProps(b.watchers['a.b'][0].mock.calls[0][1]);
  expect(newBValue).toEqual({'country': 'France'});
  expect(oldBValue).toEqual({'country': 'Italy'});
  expect(b.watchers['a'][0]).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), rootScope, 'a');
  newBValue = onlyRealProps(b.watchers['a'][0].mock.calls[0][0]);
  oldBValue = onlyRealProps(b.watchers['a'][0].mock.calls[0][1]);
  expect(newBValue).toEqual({'b': {'country': 'France'}});
  expect(oldBValue).toEqual({'b': {'country': 'Italy'}});
  expect(b.watchers['a'][1]).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), rootScope, 'a');
  newBValue = onlyRealProps(b.watchers['a'][1].mock.calls[0][0]);
  oldBValue = onlyRealProps(b.watchers['a'][1].mock.calls[0][1]);
  expect(newBValue).toEqual({'b': {'country': 'France'}});
  expect(oldBValue).toEqual({'b': {'country': 'Italy'}});
  expect(b.watchers['country'][0]).not.toHaveBeenCalled();
  // test with loop boundary
  b.watchers = {
    'a.b.country': [jest.fn()],
    'b.country': [jest.fn()],
    'b': [jest.fn()],
    'a.b': [jest.fn()],
    'a': [jest.fn()],
    'country': [jest.fn()],
  };
  superScope[SCOPE_NAME_ATTR] = '';
  b.triggerWatchers(scope, 'country', 'Spain', 'France');
  expect(b.watchers['a.b.country'][0]).not.toHaveBeenCalled();
  expect(b.watchers['b.country'][0]).toHaveBeenCalledWith('France', 'Spain', scope, 'country');
  expect(b.watchers['b'][0]).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), superScope, 'b');
  newBValue = onlyRealProps(b.watchers['b'][0].mock.calls[0][0]);
  oldBValue = onlyRealProps(b.watchers['b'][0].mock.calls[0][1]);
  expect(newBValue).toEqual({'country': 'France'});
  expect(oldBValue).toEqual({'country': 'Spain'});
  expect(b.watchers['a.b'][0]).not.toHaveBeenCalled();
  expect(b.watchers['a'][0]).not.toHaveBeenCalled();
  expect(b.watchers['country'][0]).not.toHaveBeenCalled();
});

test("Bjs applyValues", () => {
  const b = instBjs();
  const domElement = {
    querySelectorAll: jest.fn(),
  }
  const scope = {
    toto: 'titi',
    foo: {
      bar: 'baz',
    },
    [INST_ATTR]: b,
    [EL_ATTR]: domElement,
  }
  const elts = [
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
    {
      getAttribute: arg => (arg == 'bbind') ? 'foo' : undefined,
      type: 'text',
      value: 'old',
      innerText: 'old text',
    },
    {
      getAttribute: arg => (arg == 'bval') ? 'foo.bar|capitalize' : undefined,
      innerText: 'Old text',
    },
    {
      getAttribute: arg => (arg == 'bval') ? "foo['bar']|capitalize" : undefined,
      innerText: 'tutu',
    },
    {
      getAttribute: arg => (arg == 'bval') ? "foo['bar'" : undefined,
      innerText: 'bad expression',
    },
  ];
  domElement.querySelectorAll.mockReturnValue(elts),
  b.applyValues(scope);
  expect(domElement.querySelectorAll).toHaveBeenCalledWith('* [bval], * [bbind]');
  expect(elts[0]['value']).toEqual('titi');
  expect(elts[0]['innerText']).toEqual('old text');
  expect(elts[1]['value']).toEqual('Old');
  expect(elts[1]['innerText']).toEqual('Old text');
  expect(elts[2]['value']).toBeUndefined();
  expect(elts[2]['innerText']).toEqual('TITI');
  expect(elts[3]['value']).toBe(scope.foo);
  expect(elts[3]['innerText']).toEqual('old text');
  expect(elts[4]['value']).toBeUndefined();
  expect(elts[4]['innerText']).toEqual('Baz');
  expect(elts[5]['value']).toBeUndefined();
  expect(elts[5]['innerText']).toEqual('Baz');
  expect(elts[6]['value']).toBeUndefined();
  expect(elts[6]['innerText']).toEqual('bad expression');
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
  const scope = { attr: 'val0' };
  global.console.error = jest.fn();
  const templateContent = {};
  const subTemplateContent = {};
  const template = {
    getAttribute: jest.fn(arg => {
      if (arg == 'type') {
        return 'bjs';
      } else if (arg == 'directive') {
        return 'bfor';
      } else if (arg == 'expr') {
        return 'countries';
      }
    }),
    content: {
      firstChild: templateContent,
    },
    nbElts: 4,
    nextSibling: {
      remove: jest.fn(),
    },
    after: jest.fn(),
  };
  const bforSubTemplates = [
    {
      getAttribute: jest.fn(arg => undefined),
    },
    {
      getAttribute: jest.fn(arg => {
        if (arg == 'type') {
          return 'bjs';
        } else if (arg == 'directive') {
          return 'bif';
        } else if (arg == 'expr') {
          return 'toto';
        }
      }),
      content: {
        firstChild: subTemplateContent,
      },
      nbElts: 1,
      nextSibling: {
        remove: jest.fn(),
      },
      after: jest.fn(),
    },
    {
      getAttribute: jest.fn(arg => {
        if (arg == 'type') {
          return 'bjs';
        } else if (arg == 'directive') {
          return 'bb';
        } else if (arg == 'expr') {
          return 'whatever';
        }
      }),
      content: {
        firstChild: {},
      },
      nextSibling: {
        remove: jest.fn(),
      },
      after: jest.fn(),
    },
  ];
  const bforElements = [
    {
      querySelectorAll: jest.fn().mockReturnValue([]),
    },
    {
      querySelectorAll: jest.fn().mockReturnValue(bforSubTemplates),
    },
  ];
  const bforScopes = [
    { attr: 'val1' },
    { attr: 'val2' },
  ];
  b.renderTemplateBfor = jest.fn((scope, element, varExpr) => {
    const res = [];
    for (let i = 0; i < bforElements.length; i++) {
      res.push([bforElements[i], bforScopes[i]]);
    }
    return res;
  });
  const bifElements = [{
    querySelectorAll: jest.fn().mockReturnValue([]),
  }];
  const bifScopes = [bforScopes[1]];
  b.renderTemplateBif = jest.fn((scope, element, varExpr) => [
    [bifElements[0], bifScopes[0]],
  ]);
  b.evaluateTemplate(template, scope);
  expect(template.getAttribute).toHaveBeenCalledWith('directive');
  expect(template.getAttribute).toHaveBeenCalledWith('expr');
  expect(b.renderTemplateBfor).toHaveBeenCalledWith(scope, templateContent, 'countries');
  expect(template.nextSibling.remove).toHaveBeenCalledTimes(4);
  expect(template.nbElts).toEqual(2);
  expect(template.after).toHaveBeenCalledTimes(1);
  expect(template.after).toHaveBeenCalledWith(...bforElements);
  expect(bforElements[0].querySelectorAll).toHaveBeenCalledWith('template');
  expect(bforElements[1].querySelectorAll).toHaveBeenCalledWith('template');
  expect(bforSubTemplates[0].getAttribute).toHaveBeenCalledWith('type');
  expect(bforSubTemplates[0].getAttribute).not.toHaveBeenCalledWith('directive');
  expect(bforSubTemplates[0].getAttribute).not.toHaveBeenCalledWith('expr');
  expect(bforSubTemplates[1].getAttribute).toHaveBeenCalledWith('type');
  expect(bforSubTemplates[1].getAttribute).toHaveBeenCalledWith('directive');
  expect(bforSubTemplates[1].getAttribute).toHaveBeenCalledWith('expr');
  expect(bforSubTemplates[2].getAttribute).toHaveBeenCalledWith('type');
  expect(bforSubTemplates[2].getAttribute).toHaveBeenCalledWith('directive');
  expect(bforSubTemplates[2].getAttribute).toHaveBeenCalledWith('expr');
  expect(b.renderTemplateBif).toHaveBeenCalledWith(bforScopes[1], templateContent, 'toto');
  expect(bforSubTemplates[1].nextSibling.remove).toHaveBeenCalledTimes(1);
  expect(bforSubTemplates[1].nbElts).toEqual(1);;
  expect(bforSubTemplates[1].after).toHaveBeenCalledTimes(1);
  expect(bforSubTemplates[1].after).toHaveBeenCalledWith(...bifElements);
  expect(bforSubTemplates[2].nextSibling.remove).not.toHaveBeenCalled();
  expect(bforSubTemplates[2].nbElts).toBeUndefined();
  expect(bforSubTemplates[2].after).not.toHaveBeenCalled();
  expect(console.error).toHaveBeenCalledWith("renderTemplateBb is not defined in BJS");
});

test("Bjs renderTemplateBif", () => {
  const b = instBjs();
  let scope = { 'toto': false };
  let element = { cloneNode: jest.fn().mockReturnThis() };
  expect(b.renderTemplateBif(scope, element, 'toto')).toEqual([]);
  expect(element.cloneNode).not.toHaveBeenCalled();
  element.cloneNode.mockClear();
  scope = { 'toto': 0 };
  expect(b.renderTemplateBif(scope, element, 'toto')).toEqual([]);
  expect(element.cloneNode).not.toHaveBeenCalled();
  element.cloneNode.mockClear();
  scope = { 'toto': '' };
  expect(b.renderTemplateBif(scope, element, 'toto')).toEqual([]);
  expect(element.cloneNode).not.toHaveBeenCalled();
  element.cloneNode.mockClear();
  scope = { 'toto': null };
  expect(b.renderTemplateBif(scope, element, 'toto')).toEqual([]);
  expect(element.cloneNode).not.toHaveBeenCalled();
  element.cloneNode.mockClear();
  scope = { 'toto': 0/0 };
  expect(b.renderTemplateBif(scope, element, 'toto')).toEqual([]);
  expect(element.cloneNode).not.toHaveBeenCalled();
  element.cloneNode.mockClear();
  scope = {};
  expect(b.renderTemplateBif(scope, element, 'toto')).toEqual([]);
  expect(element.cloneNode).not.toHaveBeenCalled();
  element.cloneNode.mockClear();
  scope = { 'toto': 'false' };
  expect(b.renderTemplateBif(scope, element, 'toto')).toEqual([[element, scope]]);
  expect(element.cloneNode).toHaveBeenCalledWith(true);
});

test("Bjs renderTemplateBfor", () => {
  const b = instBjs();
  const element = { cloneNode: jest.fn().mockReturnThis() };
  let scope = {};
  b.createScope = (domElement, scope, superScope) => ({...scope, [SUPER_ATTR]: superScope, [EL_ATTR]: domElement});
  b.applyValues = jest.fn();
  expect(b.renderTemplateBfor(scope, element, 'lst')).toEqual([]);
  expect(element.cloneNode).not.toHaveBeenCalled();
  expect(b.applyValues).not.toHaveBeenCalled();
  element.cloneNode.mockClear();
  b.applyValues.mockClear();
  scope = {'lst': new Map([['k1', 'v1'], ['k2', 'v2']])};
  const localScope1 = {
    '$index': 'k1',
    '$value': 'v1',
    [SUPER_ATTR]: scope,
    [EL_ATTR]: element,
  };
  const localScope2 = {
    '$index': 'k2',
    '$value': 'v2',
    [SUPER_ATTR]: scope,
    [EL_ATTR]: element,
  };
  expect(b.renderTemplateBfor(scope, element, 'lst')).toEqual([
    [element, localScope1],
    [element, localScope2],
  ]);
  expect(element.cloneNode).toHaveBeenCalledTimes(2);
  expect(element.cloneNode).toHaveBeenCalledWith(true);
  expect(b.applyValues).toHaveBeenCalledTimes(2);
  expect(b.applyValues).toHaveBeenCalledWith(localScope1);
  expect(b.applyValues).toHaveBeenCalledWith(localScope2);
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
