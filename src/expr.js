/*
 * Grammar:
 *   EXPRESSION := SIMPLE_EXPRESSION [ PIPE ]
 *   PIPE := "|" FILTER [ PIPE ]
 *   FILTER := FILTER_ID [ ":" SIMPLE_EXPRESSION ]
 *   SIMPLE_EXPRESSION := LITERAL_EXPRESSION | VAR_EXPRESSION
 *   LITERAL_EXPRESSION := STRING | NUMBER | BOOLEAN
 *   STRING := STRING_QUOTE | STRING_DBQUOTE
 *   STRING_QUOTE := "'" [^']* "'"
 *   STRING_DBQUOTE := "\"" [^"]* "\""
 *   NUMBER := -?[0-9]+ [ DECIMAL_PART ]
 *   DECIMAL_PART := "." [0-9]+
 *   BOOLEAN := "true" | "false"
 *   VAR_EXPRESSION := ID [SUBSCOPE]
 *   ID := [$_A-Za-z][$_A-Za-z0-9]*
 *   SUBSCOPE := "." VAR_EXPRESSION | "[" EXPRESSION "]" [SUBSCOPE]
 *
 * which could be written:
 *   EXPRESSION := SIMPLE_EXPRESSION PIPE
 *   PIPE := "|" FILTER PIPE
 *   PIPE := ε
 *   FILTER := FILTER_ID FILTER_ARG
 *   FILTER_ID := [$_A-Za-z][$_A-Za-z0-9]*
 *   FILTER_ARG := ":" SIMPLE_EXPRESSION
 *   FILTER_ARG := ε
 *   SIMPLE_EXPRESSION := LITERAL_EXPRESSION | VAR_EXPRESSION
 *   LITERAL_EXPRESSION := STRING | NUMBER | BOOLEAN
 *   STRING := STRING_QUOTE | STRING_DBQUOTE
 *   STRING_QUOTE := "'" [^']* "'"
 *   STRING_DBQUOTE := '"' [^"]* '"'
 *   NUMBER := -?[0-9]+(?:\.[0-9]+)?
 *   BOOLEAN := "true" | "false"
 *   VAR_EXPRESSION := ID SUBSCOPE
 *   ID := [$_A-Za-z][$_A-Za-z0-9]*
 *   SUBSCOPE := DOTEXPR
 *   SUBSCOPE := SQUAREEXPR
 *   SUBSCOPE := ε
 *   DOTEXPR := "." VAR_EXPRESSION
 *   SQUAREEXPR := "[" EXPRESSION "]" SUBSCOPE
 */
import {
  INST_ATTR,
} from "./scope_common.js";

export class ValueException extends EvalError {
  constructor(message) {
    super(message);
  }
};

export function getValueFromExpr(scope, expr) {
  let rootScope = scope;
  while (rootScope.$super != null) {
    rootScope = rootScope.$super;
  }
  const {
    nextScope,
    nextEvaluatedExpr,
    rest,
  } = parseExpression(rootScope, scope, '', expr);
  if (rest) {
    throw new ValueException(`unexpected token "${rest}", expected end of expression`);
  }
  return nextScope;
}

const DOT = '.';
const OSB = '[';
const CSB = ']';
const PIPE = '|';
const COLON = ':';
const idRegex = new RegExp(/^([$_A-Za-z][$_A-Za-z0-9]*)(.*)/);
const stringQuoteRegex = new RegExp(/^'([^']*)'(.*)/);
const stringDbQuoteRegex = new RegExp(/^"([^"]*)"(.*)/);
const numberRegex = new RegExp(/^(-?[0-9]+(?:\.[0-9]+)?)(.*)/);
const booleanRegex = new RegExp(/(true|false)(.*)/);

function parseExpression(rootScope, scope, evaluatedExpr, expr) {
  const {
    nextScope,
    nextEvaluatedExpr,
    rest,
  } = parseSimpleExpression(rootScope, scope, evaluatedExpr, expr);
  return parsePipe(rootScope, nextScope, nextEvaluatedExpr, rest);
}

function parsePipe(rootScope, scope, evaluatedExpr, expr) {
  if (expr && expr[0] == PIPE) {
    const {
      nextScope,
      nextEvaluatedExpr,
      rest,
    } = parseFilter(rootScope, scope, `${evaluatedExpr}${PIPE}`, expr.substring(1));
    return parsePipe(rootScope, nextScope, nextEvaluatedExpr, rest);
  }
  return { // ε
    nextScope: scope,
    nextEvaluatedExpr: evaluatedExpr,
    rest: expr,
  };
}

function parseFilter(rootScope, scope, evaluatedExpr, expr) {
  const filterIdResult = parseFilterId(rootScope, rootScope, evaluatedExpr, expr);
  const filterArgResult = parseFilterArg(rootScope, rootScope, filterIdResult.nextEvaluatedExpr, filterIdResult.rest);
  const filterFunction = filterIdResult.nextScope;
  const filterArgResultHasConsumed = filterArgResult.rest != filterIdResult.rest;
  const filterArgs =  filterArgResultHasConsumed ? [scope, filterArgResult.nextScope] : [scope];
  return {
    nextScope: filterFunction(...filterArgs),
    nextEvaluatedExpr: filterArgResult.nextEvaluatedExpr,
    rest: filterArgResult.rest,
  }
}

function parseFilterId(rootScope, scope, evaluatedExpr, expr) {
  const m = idRegex.exec(expr);
  if (m) {
    const filter = m[1];
    const rest = m[2];
    const bjs = rootScope[INST_ATTR];
    if (!bjs.filters.has(filter)) {
      throw new ValueException(`filter "${filter}" does not exist`);
    }
    const nextScope = bjs.filters.get(filter);
    const nextEvaluatedExpr = `${evaluatedExpr}${filter}`;
    return {
      nextScope,
      nextEvaluatedExpr,
      rest,
    };
  } else {
    throw new ValueException(`filter expected at "${evaluatedExpr}"`);
  }
}

function parseFilterArg(rootScope, scope, evaluatedExpr, expr) {
  if (expr && expr[0] == COLON) {
    return parseSimpleExpression(rootScope, scope, `${evaluatedExpr}${COLON}`, expr.substring(1));
  }
  return { // ε
    nextScope: scope,
    nextEvaluatedExpr: evaluatedExpr,
    rest: expr,
  };
}

function parseSimpleExpression(rootScope, scope, evaluatedExpr, expr) {
  if (expr) {
    const literalResult = parseLiteralExpression(rootScope, scope, evaluatedExpr, expr);
    if (literalResult === null) {
      return parseVarExpression(rootScope, scope, evaluatedExpr, expr);
    } else {
      return literalResult;
    }
  } else {
    throw new ValueException(`expression expected at "${evaluatedExpr}"`);
  }
}

function parseLiteralExpression(rootScope, scope, evaluatedExpr, expr) {
  let result = parseString(rootScope, scope, evaluatedExpr, expr);
  if (result === null) {
    result = parseNumber(rootScope, scope, evaluatedExpr, expr);
  }
  if (result === null) {
    result = parseBoolean(rootScope, scope, evaluatedExpr, expr);
  }
  return result;
}

function parseString(rootScope, scope, evaluatedExpr, expr) {
  for (let [regex, quoteChar] of [
    [stringQuoteRegex, "'"],
    [stringDbQuoteRegex, '"'],
  ]) {
    const m = regex.exec(expr);
    if (m) {
      const str = m[1];
      const rest = m[2];
      // use %q for quote, %% for % character
      const strResolved = str.replace('%q', quoteChar).replace('%%', '%');
      return {
        nextScope: strResolved,
        nextEvaluatedExpr: `${evaluatedExpr}${quoteChar}${str}${quoteChar}`,
        rest,
      };
    }
  }
  return null;
}

function parseNumber(rootScope, scope, evaluatedExpr, expr) {
  const m = numberRegex.exec(expr);
  if (m) {
    const nb = m[1];
    const rest = m[2];
    return {
      nextScope: 1 * nb,
      nextEvaluatedExpr: `${evaluatedExpr}${nb}`,
      rest,
    };
  } else {
    return null;
  }
}

function parseBoolean(rootScope, scope, evaluatedExpr, expr) {
  const m = booleanRegex.exec(expr);
  if (m) {
    const b = m[1];
    const rest = m[2];
    return {
      nextScope: b == 'true',
      nextEvaluatedExpr: `${evaluatedExpr}${b}`,
      rest,
    };
  } else {
    return null;
  }
}

function parseVarExpression(rootScope, scope, evaluatedExpr, expr) {
  const {
    nextScope,
    nextEvaluatedExpr,
    rest,
  } = parseId(rootScope, scope, evaluatedExpr, expr);
  return parseSubScope(rootScope, nextScope, nextEvaluatedExpr, rest);
}

function parseId(rootScope, scope, evaluatedExpr, expr) {
  const m = idRegex.exec(expr);
  if (m) {
    const id = m[1];
    const rest = m[2];
    if (!(id in scope)) {
      throw new ValueException(`identifier "${id}" does not exist in scope "${evaluatedExpr || '<root>'}"`);
    }
    const nextScope = scope[id];
    const nextEvaluatedExpr = `${evaluatedExpr}${id}`;
    return {
      nextScope,
      nextEvaluatedExpr,
      rest,
    };
  } else {
    throw new ValueException(`identifier expected at "${evaluatedExpr}", "${expr}" given`);
  }
}

function parseSubScope(rootScope, scope, evaluatedExpr, expr) {
  if (expr && (expr[0] == DOT || expr[0] == OSB)) {
    if (expr[0] == DOT) {
      return parseDotExpr(rootScope, scope, evaluatedExpr, expr);
    }
    if (expr[0] == OSB) {
      return parseSquareExpr(rootScope, scope, evaluatedExpr, expr);
    }
  }
  return { // ε
    nextScope: scope,
    nextEvaluatedExpr: evaluatedExpr,
    rest: expr,
  };
}

function parseDotExpr(rootScope, scope, evaluatedExpr, expr) {
  return parseVarExpression(rootScope, scope, `${evaluatedExpr}${DOT}`, expr.substring(1));
}

function parseSquareExpr(rootScope, scope, evaluatedExpr, expr) {
  let nextEvaluatedExpr = `${evaluatedExpr}${OSB}`;
  const subExprResult = parseExpression(rootScope, rootScope, '', expr.substring(1));
  const subEvaluatedExpr = subExprResult.nextEvaluatedExpr;
  nextEvaluatedExpr += subEvaluatedExpr;
  if (!subExprResult.rest || subExprResult.rest[0] != CSB) {
    throw new ValueException(`${CSB} expected at "${nextEvaluatedExpr}", "${subExprResult.rest}" given`);
  }
  const rest = subExprResult.rest.substring(1);
  nextEvaluatedExpr += CSB;
  if (!(subExprResult.nextScope in scope)) {
    throw new ValueException(`map arg "${subExprResult.nextScope}" (${subEvaluatedExpr}) does not exist in scope "${evaluatedExpr || '<root>'}"`);
  }
  const nextScope = scope[subExprResult.nextScope];
  return parseSubScope(rootScope, nextScope, nextEvaluatedExpr, rest);
}
