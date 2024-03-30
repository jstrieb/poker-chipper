<style>
  div {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
    gap: 0 1ch;
    max-width: 100%;
  }

  .label {
    white-space: pre;
    margin-bottom: 2px;
  }

  .input {
    user-select: none;
    cursor: col-resize;
    flex-grow: 1;
    flex-shrink: 1;
    min-width: fit-content;
    width: 100%;
    padding: 0.25em;
    outline: none;
    justify-content: center;
    align-items: baseline;
    text-align: center;
    border: 2px solid var(--main-fg-color);
    box-shadow: 3px 3px 0 0 var(--main-fg-color);
  }
</style>

<script>
  import { spring } from "svelte/motion";
  import { compose, roundToNearest, scale } from "./helpers";

  export let value,
    transforms = {},
    display = (x) => x,
    min = -Infinity,
    max = Infinity;
  let initialValue = value;
  let numInput,
    queued = 0,
    pointerStart = 0,
    deltaX = spring(0, { stiffness: 0.15, damping: 0.3 });
  let boxWidth;
  $: transform = compose(
    roundToNearest(initialValue, ...(transforms.round ?? [{ multiple: 1 }])),
    scale(transforms.initialScale ?? 1),
  );

  function minmax(x) {
    return Math.min(max, Math.max(min, x));
  }

  function sigmoid(x) {
    return x / (1 + Math.abs(x));
  }

  function pointerdown(e) {
    numInput.addEventListener("pointermove", pointermove);
    numInput.setPointerCapture(e.pointerId);
    const { left, right } = e.target.getBoundingClientRect();
    boxWidth = right - left;
    pointerStart = e.clientX;
  }

  function pointerup(e) {
    numInput.removeEventListener("pointermove", pointermove);
    numInput.releasePointerCapture(e.pointerId);
    queued = 0;
    pointerStart = 0;
    deltaX.set(0);
    initialValue = value;
  }

  function pointermove(e) {
    const { left, right } = e.target.getBoundingClientRect();
    boxWidth = right - left;
    const sign = -1 * Math.sign(e.clientX - pointerStart);
    deltaX.set(
      sign *
        Math.min(
          Math.abs(sigmoid((e.clientX - pointerStart) / 10)),
          Math.abs((e.clientX - pointerStart) / (boxWidth / 2)),
        ),
      {
        hard: true,
      },
    );
    queued = transform(e.clientX - pointerStart);
    value = minmax(initialValue + queued);
  }
</script>

<div>
  <span class="label"><slot /></span>
  <div
    class="input"
    bind:this="{numInput}"
    on:pointerdown="{pointerdown}"
    on:pointerup="{pointerup}"
  >
    <span
      style:transform="translateX(calc({$deltaX} * ({boxWidth / 2}px - 4ch)))"
      >{display(value)}</span
    >
  </div>
</div>
