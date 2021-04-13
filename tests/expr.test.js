import {jest, test, expect, beforeEach, afterEach} from '@jest/globals';
import {
  getValueFromExpr,
} from "../src/expr.js";

let scope;

beforeEach(() => {
  scope = {
    toto: {
      titi: 'tutu',
    },
  };
});

test("string literal expression", () => {
  let value = getValueFromExpr(scope, "'This is a test'");
  expect(value).toBe('This is a test');
  value = getValueFromExpr(scope, "'Don%qt drop it to 0%%'");
  expect(value).toBe("Don't drop it to 0%");
});
