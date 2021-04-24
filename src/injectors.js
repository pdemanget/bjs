import {
  Core,
} from "./core.js";
import {
  getValueFromExpr,
} from "./expr.js";

export function injectorBval(scope, element, varExpr, injector) {
  try {
    const value = getValueFromExpr(scope, varExpr);
    if (element.type) {
      element.value = value === undefined ? '' : value;
    } else {
      element.innerText = value === undefined ? '' : value;
    }
  } catch (e) {
    // this could be normal to have an evaluated expression that fails
  }
}
Core.registerInjector('bval', injectorBval);

export function injectorBattr(scope, element, varExpr, injector) {
  let battrValues = [];
  const exprAttrs = (varExpr || '').split(';').map(expr => expr.trimStart());
  if (!exprAttrs[0]) {
    exprAttrs.shift();
  }
  const attrs = [];
  const r = /\$\{([^}]+)\}(.*)/;
  let error = false;
  for (let i = 0; i < exprAttrs.length; i++) {
    let exprAttr = exprAttrs[i];
    if (!exprAttr.includes('=')) {
      error = true;
      break;
    }
    let m = exprAttr.match(new RegExp(r));
    attrs[i] = '';
    while (m) {
      if (m.index) {
        attrs[i] += exprAttr.substring(0, m.index);
      }
      try {
        const value = getValueFromExpr(scope, m[1]);
        attrs[i] += value === undefined || value == null ? '' : value;
      } catch (e) {
        // nothing is generated in that case
        error = true;
        break;
      }
      exprAttr = m[2];
      m = exprAttr.match(new RegExp(r));
    }
    if (error) {
      break;
    }
    if (exprAttr) {
      attrs[i] += exprAttr;
    }
  }
  if (error) {
    battrValues = [];
  } else {
    battrValues = attrs.map(attr => {
      const eqPos = attr.indexOf('=');
      return [attr.substring(0, eqPos), attr.substring(eqPos + 1)];
    });
  }
  for (const [attr, value] of battrValues) {
    element.setAttribute(attr, value);
  }
}
Core.registerInjector('battr', injectorBattr);
