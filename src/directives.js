import {
  Core,
} from "./core.js";
import {
  getValueFromExpr,
} from "./expr.js";

export const getDefaultResult = () => ({
  varValue: null,
  toRender: true,
  elts: [],
});

export function directiveBif(scope, element, varExpr, prevEval, directive) {
  const res = getDefaultResult();
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
  res.varValue = value;
  if (value === prevEval) {
    res.toRender = false;
  }
  if (value) {
    res.elts.push([element.cloneNode(true), scope]);
  }
  return res;
}
Core.registerDirective('bif', directiveBif);

export function directiveBfor(scope, element, varExpr, prevEval, directive) {
  const res = getDefaultResult();
  let iterable;
  try {
    iterable = getValueFromExpr(scope, varExpr);
  } catch(e) {
    iterable = null;
  }
  res.varValue = iterable;
  if (iterable === prevEval) {
    res.toRender = false;
    iterable = prevEval;
  }
  if (iterable && iterable.entries) {
    for (let entry of iterable.entries()) {
      const oneElt = element.cloneNode(true);
      const localScope = this.createScope(oneElt, {
        "$index": entry[0],
        "$value": entry[1],
      }, scope);
      if (false && res.toRender) {
        // TODO does this should be done here?
        this.applyValues(localScope);
      }
      res.elts.push([oneElt, localScope]);
    }
  }
  return res;
}
Core.registerDirective('bfor', directiveBfor);
