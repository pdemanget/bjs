import {jest, test, expect, beforeEach, afterEach} from '@jest/globals';
import {
  getValueFromExpr,
} from "../src/expr.js";

let scope;

beforeEach(() => {
  global.console.debug = jest.fn();
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
  console.debug.mockClear();
  value = getValueFromExpr(scope, "titi");
  expect(value).toBeUndefined();
  expect(console.debug).toHaveBeenCalledWith('identifier "titi" does not exist in scope "<root>"');
  console.debug.mockClear();
  value = getValueFromExpr(scope, "%test");
  expect(value).toBeUndefined();
  expect(console.debug).toHaveBeenCalledWith('identifier expected at "", "%test" given');
  console.debug.mockClear();
  value = getValueFromExpr(scope, "");
  expect(value).toBeUndefined();
  expect(console.debug).toHaveBeenCalledWith('expression expected at ""');
});

test("dot var expression", () => {
  let value = getValueFromExpr(scope, "toto.titi");
  expect(value).toEqual("tutu");
  value = getValueFromExpr(scope, "toto.foo");
  expect(value).toEqual({ bar: "baz" });
  console.debug.mockClear();
  value = getValueFromExpr(scope, "toto.test");
  expect(value).toBeUndefined();
  expect(console.debug).toHaveBeenCalledWith('identifier "test" does not exist in scope "toto."');
  value = getValueFromExpr(scope, "toto.foo.bar");
  expect(value).toEqual("baz");
});

test("square var expression", () => {
  let value = getValueFromExpr(scope, "toto['titi']");
  expect(value).toEqual("tutu");
  console.debug.mockClear();
  value = getValueFromExpr(scope, "toto['titi'");
  expect(value).toBeUndefined();
  expect(console.debug).toHaveBeenCalledWith(`] expected at "toto['titi'", "" given`);
  console.debug.mockClear();
  value = getValueFromExpr(scope, "toto[tata]");
  expect(value).toBeUndefined();
  expect(console.debug).toHaveBeenCalledWith(`map arg "tete" (tata) does not exist in scope "toto"`);
});

test("filter expression", () => {
  const upper = obj => ('' + obj).toUpperCase();
  const extract = (obj, idx) => ('' + obj)[1 * idx];
  const filters = new Map(Object.entries({
    upper,
    extract,
  }));
  const rootScope = {
    "$b": { filters },
  };
  scope.$super = rootScope;
  let value = getValueFromExpr(scope, "tata|upper");
  expect(value).toEqual("TETE");
  value = getValueFromExpr(scope, "tata|upper|extract:2");
  expect(value).toEqual("T");
  console.debug.mockClear();
  value = getValueFromExpr(scope, "tata|upper|extract:4");
  expect(value).toBeUndefined();
  expect(console.debug).not.toHaveBeenCalled();
  console.debug.mockClear();
  value = getValueFromExpr(scope, "tata|lower");
  expect(value).toBeUndefined();
  expect(console.debug).toHaveBeenCalledWith('filter "lower" does not exist');
  console.debug.mockClear();
  value = getValueFromExpr(scope, "tata|");
  expect(value).toBeUndefined();
  expect(console.debug).toHaveBeenCalledWith('filter expected at "tata|"');
});

test("remaining expression", () => {
  console.debug.mockClear();
  let value = getValueFromExpr(scope, "tata%bidule");
  expect(value).toBeUndefined();
  expect(console.debug).toHaveBeenCalledWith('unexpected token "%bidule", expected end of expression');
});
