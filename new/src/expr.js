/*
 * EXPRESSION := ID [SUBSCOPE]
 * SUBSCOPE := ("." EXPRESSION | "[" EXPRESSION "]") [SUBSCOPE]
 *
 * which could be written
 * EXPRESSION := ID SUBSCOPE
 * SUBSCOPE := DOTEXPR
 * SUBSCOPE := SQUAREEXPR
 * SUBSCOPE := ε
 * DOTEXPR := "." EXPRESSION
 * SQUAREEXPR := "[" EXPRESSION "]" SUBSCOPE
 * ID := [$_A-Za-z][$_A-Za-z0-9]*
 */

export function getValueFromExpr(scope, expr) {
  try {
    const {
      nextScope,
      nextEvaluatedExpr,
      rest,
    } = parseExpression(scope, 'scope', expr, false);
    if (rest) {
      throw `unexpected token ${rest}, expected end of expression`;
    }
    return nextScope;
  } catch (e) {
    console.debug(e);
    return undefined;
  }
}

const idRegex = new RegExp('^([$_A-Za-z][$_A-Za-z0-9]*)(.*)');

function parseExpression(scope, evaluatedExpr, expr, closingBracketExpected) {
  const {
    nextScope,
    nextEvaluatedExpr,
    rest,
  } = parseId(scope, evaluatedExpr, expr);
  return parseSubScope(nextScope, nextEvaluatedExpr, rest, closingBracketExpected);
}

function parseId(scope, evaluatedExpr, expr) {
  const m = idRegex.exec(expr);
  if (m) {
    const id = m[1];
    const rest = m[2];
    if (!(id in scope)) {
      throw `ID "${id}" does not exist in scope ${evaluatedExpr}`;
    }
    const nextScope = scope[id];
    const nextEvaluatedExpr = `${evaluatedExpr}.${id}`;
    return {
      nextScope,
      nextEvaluatedExpr,
      rest,
    };
  } else {
    throw `ID expected at ${evaluatedExpr}, ${expr} given`;
  }
}

function parseSubScope(scope, evaluatedExpr, expr, closingBracketExpected) {
  if (expr) {
    if (expr[0] == ".") {
      return parseDotExpr(scope, evaluatedExpr, expr.substring(1));
    } else if (expr[0] == "[") {
      return parseSquareExpr(scope, evaluatedExpr, expr.substring(1));
    } else if (closingBracketExpected && expr[0] == "]") {
      return {
        nextScope: scope,
        nextEvaluatedExpr: evaluatedExpr,
        rest: expr.substring(1),
      };
    } else {
      throw `".", "["${closingBracketExpected ? ', "]"': ''} or empty expected at ${evaluatedExpr}, ${expr} given`;
    }
  } else {
    return {
      nextScope: scope,
      nextEvaluatedExpr: evaluatedExpr,
      rest: '',
    };
  }
}

function parseDotExpr(scope, evaluatedExpr, expr) {
  return parseExpression(scope, `${evaluatedExpr}.`, expr);
}

function parseSquareExpr(scope, evaluatedExpr, expr) {
  let rootScope = scope;
  while (rootScope.$super != null) {
    rootScope = rootScope.$super;
  }
  const squareExprResult = parseExpression(rootScope, 'scope', expr, true);
  if (!(squareExprResult.nextScope in scope)) {
    throw `map arg "${squareExprResult.nextScope}" (${squareExprResult.nextEvaluatedExpr}) does not exist in scope ${evaluatedExpr}`;
  }
  const nextScope = scope[squareExprResult.nextScope];
  const nextEvaluatedExpr = `${evaluatedExpr}[${squareExprResult.nextScope}]`;
  return parseSubScope(nextScope, nextEvaluatedExpr, squareExprResult.rest);
}
