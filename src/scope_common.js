export const SCOPE_NAME_ATTR = "$bjs:name";
export const EL_ATTR = "$bjs:el";
export const INST_ATTR = "$bjs:b";
export const SUPER_ATTR = "$super";
export const hasFct = (superScope, extendedHasFct) => function(target, prop) {
  return (
    prop in target
    || prop == SCOPE_NAME_ATTR
    || prop == EL_ATTR
    || prop == INST_ATTR
    || (superScope != null && prop == SUPER_ATTR)
    || (superScope != null && prop in superScope)
    || (extendedHasFct && extendedHasFct(target, prop))
  );
};
export const getFct = (bInstance, superScope, scopeName, domElement, extendedGetFct) => function(target, prop, receiver) {
  if (prop == SCOPE_NAME_ATTR) {
    return scopeName;
  } else if (prop == EL_ATTR) {
    return domElement || (superScope && superScope[EL_ATTR]);
  } else if (prop == INST_ATTR) {
    return bInstance;
  } else if (prop == SUPER_ATTR) {
    return superScope;
  } else if (superScope != null && !(prop in target)) {
    return superScope[prop];
  } else {
    return extendedGetFct ? extendedGetFct(target, prop, receiver) : target[prop];
  }
};
