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
    text-align: center;
    border: 2px solid var(--main-fg-color);
    box-shadow: 5px 5px 0 0 var(--main-fg-color);
  }
</style>

<script>
  export let value, transform;
  $: if (!transform) {
    transform = roundToNearest(5);
  }
  let numInput,
    queued = 0,
    offset = 0;

  let roundToNearest = (x) => x;
  $: roundToNearest = (x) => {
    return (y) => {
      const scale = 10;
      const sign = Math.sign(y);
      y = Math.abs(Math.floor(y / scale));
      const exponent = Math.floor(Math.log(y) / Math.log(x));
      const power = Math.pow(x, exponent);
      return (power * Math.floor(y / power) || 0) * sign;
    };
  };

  function pointerdown(e) {
    numInput.addEventListener("pointermove", pointermove);
    numInput.setPointerCapture(e.pointerId);
    const { left, right } = e.target.getBoundingClientRect();
    const width = right - left;
    offset = e.clientX - left - Math.floor(width / 2);
  }

  function pointerup(e) {
    numInput.removeEventListener("pointermove", pointermove);
    numInput.releasePointerCapture(e.pointerId);
    value += queued;
    queued = 0;
    offset = 0;
  }

  function pointermove(e) {
    const { left, right } = e.target.getBoundingClientRect();
    const width = right - left;
    queued = transform(e.clientX - offset - left - Math.floor(width / 2));
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
    {value + queued}
  </div>
</div>
