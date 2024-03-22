<style>
  div {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: baseline;
    gap: 0 1ch;
    max-width: 100%;
  }

  div span {
    white-space: pre;
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
  import { compose, roundToNearest, scale } from "./helpers";

  export let value,
    transforms = {},
    display = (x) => x,
    min = -Infinity,
    max = Infinity;
  let initialValue = value;
  let numInput,
    queued = 0,
    offset = 0;
  $: transform = compose(
    (x) => x * (transforms.finalScale ?? 1),
    roundToNearest(initialValue, ...(transforms.round ?? [{ multiple: 1 }])),
    scale(transforms.initialScale ?? 1),
  );

  function minmax(x) {
    return Math.min(max, Math.max(min, x));
  }

  function pointerdown(e) {
    e.stopPropagation();
    e.preventDefault();
    numInput.addEventListener("pointermove", pointermove);
    numInput.setPointerCapture(e.pointerId);
    const { left, right } = e.target.getBoundingClientRect();
    const width = right - left;
    offset = e.clientX - left - Math.floor(width / 2);
  }

  function pointerup(e) {
    e.stopPropagation();
    e.preventDefault();
    numInput.removeEventListener("pointermove", pointermove);
    numInput.releasePointerCapture(e.pointerId);
    queued = 0;
    offset = 0;
    initialValue = value;
  }

  function pointermove(e) {
    e.stopPropagation();
    e.preventDefault();
    const { left, right } = e.target.getBoundingClientRect();
    const width = right - left;
    queued = transform(e.clientX - offset - left - Math.floor(width / 2));
    value = minmax(initialValue + queued);
  }
</script>

<div>
  <span><slot /></span>
  <div
    class="input"
    bind:this="{numInput}"
    on:pointerdown="{pointerdown}"
    on:pointerup="{pointerup}"
  >
    {display(value)}
  </div>
</div>
