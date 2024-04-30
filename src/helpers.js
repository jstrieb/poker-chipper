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

const formatter = Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
});
export function dollars(x) {
  return formatter.format(x / 100);
}

export function debounce(f, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => f(...args), delay);
  };
}

export function select(e) {
  window.getSelection().selectAllChildren(e.target ?? e);
}

export function compress(data) {
  if (!data?.length) {
    return;
  }
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = canvas.height = Math.ceil(Math.sqrt(data.length / 3));
  const image = context.createImageData(canvas.width, canvas.height);
  for (let i = 0; i < data.length; i++) {
    image.data[i] = data[i];
  }
  context.putImageData(image, 0, 0);
  console.log("image", image);
  return canvas.toDataURL("image/png").replace(/(.*,)+/g, "");
}

export function decompress(data) {
  if (!data?.length) {
    return;
  }
  const image = new Image();
  image.setAttribute("src", `data:image/png;base64,${data}`);
  return new Promise((r) => {
    image.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1000;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const result = context.getImageData(0, 0, image.width, image.height);
      console.log("result", result);
      r(result.data);
    });
  });
}

const d = compress(new TextEncoder().encode("This is a test!".repeat(100)));
console.log(d, d.length);
decompress(d)
  .then((r) => new TextDecoder().decode(r))
  .then(console.log);
