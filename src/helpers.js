export function roundToNearest(x) {
  return (y) => Math.floor(y / x) * x;
}

export function roundToNearestPower(base) {
  return (x) => {
    const sign = Math.sign(x);
    x = Math.abs(x);
    const exponent = Math.floor(Math.log(x) / Math.log(base));
    const power = Math.pow(base, exponent);
    return (roundToNearest(power)(x) || 0) * sign;
  };
}

// Compose the arguments in the reverse of the order they are passed. In other
// words, the first argument is the outermost function evaluation.
export function compose(...functions) {
  return (result) => {
    for (let i = 0; i < functions.length; i++) {
      result = functions[functions.length - i - 1](result);
    }
    return result;
  };
}

export function scale(scaleValue) {
  return (x) => Math.floor(x / scaleValue);
}
