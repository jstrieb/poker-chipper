import { reloadModule, solve } from "./solve.js";

self.addEventListener("message", async (e) => {
  try {
    self.postMessage({ data: await solve(...e.data) });
  } catch (error) {
    self.postMessage({ error });
    reloadModule();
  }
});
