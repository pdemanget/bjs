import {
  Core,
} from "./core.js";
import {
  getValueFromExpr,
} from "./expr.js";

export function directiveBif(scope, element, varExpr, directive) {
  const res = [];
  let value;
  try {
    value = getValueFromExpr(scope, varExpr);
  } catch(e) {
    value = false;
  }
  // ensure empty array, object, map or set are considered falsy
  if (value instanceof Map || value instanceof Set) {
    value = value.size;
  } else if (value instanceof Array || (value instanceof Object && value.constructor.entries)) {
    value = Object.entries(value).length;
  }
  if (value) {
    res.push([element.cloneNode(true), scope]);
  }
  return res;
}
Core.registerDirective('bif', directiveBif);

export function directiveBfor(scope, element, varExpr, directive) {
  const res = [];
  let iterable;
  try {
    iterable = getValueFromExpr(scope, varExpr);
  } catch(e) {
    iterable = null;
  }
  if (iterable && iterable.entries) {
    for (let entry of iterable.entries()) {
      const oneElt = element.cloneNode(true);
      const localScope = this.createScope(oneElt, {
        "$index": entry[0],
        "$value": entry[1],
      }, scope);
      this.applyValues(localScope);
      res.push([oneElt, localScope]);
    }
  }
  return res;
}
Core.registerDirective('bfor', directiveBfor);
