<style>
  input {
    border: none;
    text-align: center;
    min-width: 1ch;
  }
</style>

<script>
  export let value = "",
    input = undefined;

  const canvas = document.createElement("canvas").getContext("2d");
  function width(s) {
    canvas.font = input
      ? window.getComputedStyle(input).getPropertyValue("font")
      : canvas.font;
    return canvas.measureText(s).width;
  }
</script>

<input
  type="text"
  bind:value
  bind:this="{input}"
  style:width="calc({width(value, input)}px + 2 * var(--padding, 3px))"
  on:input
  on:beforeinput
  on:focus
  on:blur
  {...$$props}
  {...$$restProps}
/>
