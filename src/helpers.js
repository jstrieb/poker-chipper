export function roundToNearestMultiple(x) {
  return (y) => Math.floor(y / x) * x;
}

export function roundToNearestPower(base) {
  return (x) => {
    const sign = Math.sign(x);
    x = Math.abs(x);
    const exponent = Math.floor(Math.log(x) / Math.log(base));
    const power = Math.pow(base, exponent);
    return (roundToNearestMultiple(power)(x) || 0) * sign;
  };
}

export function roundToNearest(initial, ...values) {
  values = values.sort((a, b) => a.multiple - b.multiple);
  return (x) => {
    const sign = Math.sign(x);
    x = Math.abs(x);
    for (let i = 0; i < values.length - 1; i++) {
      // TODO: This code can be made substantially clearer and cleaner
      const nextMultiple = values[i + 1].multiple;
      const leftover = initial % nextMultiple;
      const diff = (nextMultiple - leftover) % nextMultiple;
      if (x <= values[i].limit + (sign > 0 ? diff : leftover)) {
        const result =
          (roundToNearestMultiple(values[i].multiple)(x + initial * sign) -
            initial * sign) *
          sign;
        return result;
      }
    }
    const result =
      (roundToNearestMultiple(values[values.length - 1].multiple)(
        x + initial * sign,
      ) -
        initial * sign) *
      sign;
    return result;
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

const dollarFormatter = Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
});
export function dollars(x) {
  return dollarFormatter.format(x / 100);
}

const percentFormatter = Intl.NumberFormat(undefined, {
  style: "percent",
});
export function percent(x) {
  return percentFormatter.format(x / 100);
}

export function debounce(f, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => f(...args), delay);
  };
}

export function select(e) {
  if (e.target.select || e.select) {
    (e.target ?? e).select();
  } else {
    window.getSelection().selectAllChildren(e.target ?? e);
  }
}

export function titleCase(s) {
  return s
    .split(" ")
    .map(
      (w) => w.slice(0, 1).toLocaleUpperCase() + w.slice(1).toLocaleLowerCase(),
    )
    .join(" ");
}

export function loadFromLocalStorage(key) {
  let result;
  try {
    result = JSON.parse(window.localStorage.getItem(key));
  } catch (_) {}
  return result ?? {};
}
