export default function deepMerge(obj1, obj2) {
  const result = {};

  Object.keys(obj1).forEach((key) => {
    if (obj1[key] instanceof Object) {
      result[key] = deepMerge({}, obj1[key]);
    } else {
      result[key] = obj1[key];
    }
  });

  Object.keys(obj2).forEach((key) => {
    if (obj2[key] instanceof Object) {
      if (result[key] && result[key] instanceof Object) {
        result[key] = deepMerge(result[key], obj2[key]);
      } else {
        result[key] = deepMerge({}, obj2[key]);
      }
    } else {
      result[key] = obj2[key];
    }
  });

  return result;
}
