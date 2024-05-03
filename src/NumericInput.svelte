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
    overflow: auto;
  }

  .input {
    user-select: none;
    -webkit-user-select: none;
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
  import GrowableInput from "./GrowableInput.svelte";

  import { compose, roundToNearest, scale, select } from "./helpers.js";

  import { spring } from "svelte/motion";
  import { tick } from "svelte";

  export let value,
    transforms = {},
    display = undefined,
    min = -Infinity,
    max = Infinity;
  let editing = false,
    editable;
  let initialValue = value;
  let numInput,
    queued = 0,
    pointerStart = { x: 0, y: 0 },
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

  let moveCount = 0,
    isScrolling = false;

  function pointerdown(e) {
    numInput.addEventListener("pointermove", pointermove);
    numInput.setPointerCapture(e.pointerId);
    const { left, right } = e.target.getBoundingClientRect();
    boxWidth = right - left;
    pointerStart = { x: e.clientX, y: e.clientY };
  }

  async function pointerup(e) {
    numInput.removeEventListener("pointermove", pointermove);
    numInput.releasePointerCapture(e.pointerId);
    const dx = Math.abs(pointerStart.x - e.clientX);
    const dy = Math.abs(pointerStart.y - e.clientY);
    if (moveCount < 20 && dy + dx < 10) {
      // Handle regular click
      e.preventDefault();
      editing = true;
      await tick();
      // setTimeout necessary to prevent jitter on mobile
      setTimeout(() => editable.focus(), 10);
    } else {
      moveCount = 0;
      queued = 0;
      pointerStart = { x: 0, y: 0 };
      deltaX.set(0);
      initialValue = value;
    }
  }

  function pointermove(e) {
    const dx = Math.abs(pointerStart.x - e.clientX);
    const dy = Math.abs(pointerStart.y - e.clientY);
    isScrolling =
      moveCount++ < 10 &&
      // Heuristic for "are we scrolling, or are we dragging"
      (dy + dx < 10 || dy > 1.5 * dx);
    if (isScrolling) {
      return;
    }
    const { left, right } = e.target.getBoundingClientRect();
    boxWidth = right - left;
    const sign = -1 * Math.sign(e.clientX - pointerStart.x);
    deltaX.set(
      sign *
        Math.min(
          Math.abs(sigmoid((e.clientX - pointerStart.x) / 10)),
          Math.abs((e.clientX - pointerStart.x) / (boxWidth / 2)),
        ),
      {
        hard: true,
      },
    );
    queued = transform(e.clientX - pointerStart.x);
    value = minmax(initialValue + queued);
  }

  // Prevent default in the touch event will block or allow scrolling based on a
  // heuristic - the built-in one for iOS causes janky interaction
  function touchmove(e) {
    if (!isScrolling) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
</script>

<div>
  <span class="label"><slot /></span>
  {#if !editing}
    <div
      class="input"
      bind:this="{numInput}"
      on:pointerdown="{pointerdown}"
      on:pointerup="{pointerup}"
      on:touchmove|capture|nonpassive="{touchmove}"
    >
      <span
        style:transform="translate3d(calc({$deltaX} * ({boxWidth / 2}px - 4ch)),
        0, 0)">{(display ?? ((x) => x))(value)}</span
      >
    </div>
  {:else}
    <div class="input">
      <GrowableInput
        inputmode="numeric"
        on:blur="{() => {
          value = parseInt(value || 0);
          editing = false;
          moveCount = 0;
          queued = 0;
          pointerStart = { x: 0, y: 0 };
          deltaX.set(0);
          initialValue = value;
        }}"
        bind:input="{editable}"
        bind:value
        on:focus="{select}"
        on:beforeinput="{(e) => {
          if (e.inputType === 'insertLineBreak') {
            e.target.blur();
          }
          if (e.data && !e.data.match(/^[0-9]*$/)) {
            e.preventDefault();
          }
        }}"
      />
      {#if display}
        <span>({display(value)})</span>
      {/if}
    </div>
  {/if}
</div>
