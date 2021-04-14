export function addFilter(obj, arg) {
  return obj + arg;
}
export function upperFilter(obj) {
  return ('' + obj).toUpperCase();
}
export function lowerFilter(obj) {
  return ('' + obj).toLowerCase();
}
export function capitalizeFilter(obj) {
  obj = '' + obj;
  if (obj.length >= 2) {
    return obj[0].toUpperCase() + obj.substring(1).toLowerCase();
  } else {
    return obj.toUpperCase();
  }
}
export function trimFilter(obj) {
  return ('' + obj).trim();
}
