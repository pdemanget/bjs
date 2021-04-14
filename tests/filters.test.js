import {jest, test, expect, beforeEach, afterEach} from '@jest/globals';
import {
  addFilter,
  upperFilter,
  lowerFilter,
  capitalizeFilter,
  trimFilter,
} from "../src/filters.js";

test("addFilter", () => {
  let value = addFilter("This is", " a test");
  expect(value).toEqual("This is a test");
  value = addFilter("This is", 42);
  expect(value).toEqual("This is42");
  value = addFilter(3, 42);
  expect(value).toEqual(45);
  value = addFilter(4, "k");
  expect(value).toEqual("4k");
  value = addFilter("This is");
  expect(value).toEqual("This isundefined");
  value = addFilter();
  expect(value).toBeNaN();
});

test("upperFilter", () => {
  let value = upperFilter("This is a test");
  expect(value).toEqual("THIS IS A TEST");
  value = upperFilter("");
  expect(value).toEqual("");
  value = upperFilter(null);
  expect(value).toEqual("NULL");
});

test("lowerFilter", () => {
  let value = lowerFilter("This is a test");
  expect(value).toEqual("this is a test");
  value = lowerFilter("");
  expect(value).toEqual("");
  value = lowerFilter(null);
  expect(value).toEqual("null");
});

test("capitalizeFilter", () => {
  let value = capitalizeFilter("this is a test");
  expect(value).toEqual("This is a test");
  value = capitalizeFilter("k");
  expect(value).toEqual("K");
  value = capitalizeFilter("");
  expect(value).toEqual("");
  value = capitalizeFilter();
  expect(value).toEqual("Undefined");
});

test("trimFilter", () => {
  let value = trimFilter("This is a test  ");
  expect(value).toEqual("This is a test");
  value = trimFilter("  Another test");
  expect(value).toEqual("Another test");
  value = trimFilter("  Yes another test  ");
  expect(value).toEqual("Yes another test");
  value = trimFilter(42);
  expect(value).toEqual("42");
  value = trimFilter();
  expect(value).toEqual("undefined");
});
