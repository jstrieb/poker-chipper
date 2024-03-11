export function roundToNeareset(x) {
  return (y) => Math.floor(y / x) * x;
}

export function roundToNearestPower(base) {
  return (x) => {
    const sign = Math.sign(x);
    x = Math.abs(x);
    const exponent = Math.floor(Math.log(x) / Math.log(base));
    const power = Math.pow(base, exponent);
    return (roundToNeareset(power)(x) || 0) * sign;
  };
}
