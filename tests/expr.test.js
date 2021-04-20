import {jest, test, expect, beforeEach, afterEach} from '@jest/globals';
import {
  getValueFromExpr,
  ValueException,
} from "../src/expr.js";
import {
  INST_ATTR,
  SUPER_ATTR,
} from "../src/scope_common.js";

let scope;

beforeEach(() => {
  scope = {
    toto: {
      titi: "tutu",
      foo: {
        bar: "baz",
      },
    },
    tata: "tete",
  };
});

test("string literal expression", () => {
  let value = getValueFromExpr(scope, "'This is a test'");
  expect(value).toBe('This is a test');
  value = getValueFromExpr(scope, "'Don%qt drop it to 0%%'");
  expect(value).toBe("Don't drop it to 0%");
  value = getValueFromExpr(scope, '"double quotes %q test"');
  expect(value).toBe("double quotes \" test");
});

test("number literal expression", () => {
  let value = getValueFromExpr(scope, "42");
  expect(value).toBe(42);
  value = getValueFromExpr(scope, "-8000");
  expect(value).toBe(-8000);
  value = getValueFromExpr(scope, "0");
  expect(value).toBe(0);
  value = getValueFromExpr(scope, "-0");
  expect(value).toBe(-0);
  value = getValueFromExpr(scope, "3.14");
  expect(value).toBe(3.14);
});

test("boolean literal expression", () => {
  let value = getValueFromExpr(scope, "true");
  expect(value).toBe(true);
  value = getValueFromExpr(scope, "false");
  expect(value).toBe(false);
});

test("simple var expression", () => {
  let value = getValueFromExpr(scope, "tata");
  expect(value).toEqual("tete");
  expect(() => {
    getValueFromExpr(scope, "titi");
  }).toThrow(new ValueException('identifier "titi" does not exist in scope "<root>"'));
  expect(() => {
    getValueFromExpr(scope, "%test");
  }).toThrow(new ValueException('identifier expected at "", "%test" given'));
  expect(() => {
    getValueFromExpr(scope, "");
  }).toThrow(new ValueException('expression expected at ""'));
});

test("dot var expression", () => {
  let value = getValueFromExpr(scope, "toto.titi");
  expect(value).toEqual("tutu");
  value = getValueFromExpr(scope, "toto.foo");
  expect(value).toEqual({ bar: "baz" });
  expect(() => {
    value = getValueFromExpr(scope, "toto.test");
  }).toThrow(new ValueException('identifier "test" does not exist in scope "toto."'));
  value = getValueFromExpr(scope, "toto.foo.bar");
  expect(value).toEqual("baz");
});

test("square var expression", () => {
  let value = getValueFromExpr(scope, "toto['titi']");
  expect(value).toEqual("tutu");
  expect(() => {
    value = getValueFromExpr(scope, "toto['titi'");
  }).toThrow(new ValueException(`] expected at "toto['titi'", "" given`));
  expect(() => {
    value = getValueFromExpr(scope, "toto[tata]");
  }).toThrow(new ValueException(`map arg "tete" (tata) does not exist in scope "toto"`));
});

test("filter expression", () => {
  const upper = obj => ('' + obj).toUpperCase();
  const extract = (obj, idx) => ('' + obj)[1 * idx];
  const filters = new Map(Object.entries({
    upper,
    extract,
  }));
  const rootScope = {
    [INST_ATTR]: { filters },
  };
  scope[SUPER_ATTR] = rootScope;
  let value = getValueFromExpr(scope, "tata|upper");
  expect(value).toEqual("TETE");
  value = getValueFromExpr(scope, "tata|upper|extract:2");
  expect(value).toEqual("T");
  value = getValueFromExpr(scope, "tata|upper|extract:4");
  expect(value).toBeUndefined();
  expect(() => {
    getValueFromExpr(scope, "tata|lower");
  }).toThrow(new ValueException('filter "lower" does not exist'));
  expect(() => {
    getValueFromExpr(scope, "tata|");
  }).toThrow(new ValueException('filter expected at "tata|"'));
});

test("remaining expression", () => {
  expect(() => {
    getValueFromExpr(scope, "tata%bidule");
  }).toThrow(new ValueException('unexpected token "%bidule", expected end of expression'));
});
