importScripts("./solve.js");

function debounce(f, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => f(...args), delay);
  };
}

let solutionPromise = new Promise((r) => r());
const debouncedSolve = debounce((...args) => {
  solutionPromise = solutionPromise
    .then((_) =>
      solve(...args).catch((e) => {
        self.postMessage({ error: e });
        reloadModule();
      }),
    )
    .then((r) => self.postMessage({ data: r }));
}, 200);

self.addEventListener("message", async (e) => {
  debouncedSolve(...e.data);
});
