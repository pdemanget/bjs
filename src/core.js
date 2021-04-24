export class Core {
  get injectors() {
    return this.constructor.injectors;
  }

  get directives() {
    return this.constructor.directives;
  }

  get filters() {
    return this.constructor.filters;
  }
}

export function setStaticProperty(cls, name, value) {
  Object.defineProperty(cls, name, { get: () => value });
}
export function setStaticFunction(cls, name, fct) {
  setStaticProperty(cls, name, fct.bind(cls));
}

setStaticProperty(Core, 'injectors', new Map());
setStaticProperty(Core, 'directives', new Map());
setStaticProperty(Core, 'filters', new Map());
// each function takes: scope, element, varExpr, injector
// each function return value is ignored
setStaticFunction(Core, 'registerInjector', function (name, fct) {
  this.injectors.set(name, fct);
});
// each function takes: scope, element, varExpr, prevEval, directive
// each function should return an object with {varValue, dom: [[newDomElement, localScope], …]}
//   if dom is null, that means no change
setStaticFunction(Core, 'registerDirective', function (name, fct) {
  this.directives.set(name, fct);
});
// each function takes: obj, [arg]
// each function should return a value or object
setStaticFunction(Core, 'registerFilter', function (name, fct) {
  this.filters.set(name, fct);
});
