import {
  Core,
} from "./core.js";

export function addFilter(obj, arg) {
  return obj + arg;
}
Core.registerFilter('add', addFilter);

export function upperFilter(obj) {
  return ('' + obj).toUpperCase();
}
Core.registerFilter('upper', upperFilter);

export function lowerFilter(obj) {
  return ('' + obj).toLowerCase();
}
Core.registerFilter('lower', lowerFilter);

export function capitalizeFilter(obj) {
  obj = '' + obj;
  if (obj.length >= 2) {
    return obj[0].toUpperCase() + obj.substring(1).toLowerCase();
  } else {
    return obj.toUpperCase();
  }
}
Core.registerFilter('capitalize', capitalizeFilter);

export function trimFilter(obj) {
  return ('' + obj).trim();
}
Core.registerFilter('trim', trimFilter);
