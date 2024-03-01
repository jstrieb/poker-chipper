<style>
  div {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: baseline;
    gap: 1ch;
    max-width: 100%;
  }

  div div {
    flex-wrap: nowrap;
    flex-grow: 1;
    flex-shrink: 1;
  }

  div span {
    white-space: pre;
  }

  div input {
    flex-grow: 1;
    flex-shrink: 1;
  }

  input {
    width: 100%;
    padding: 0.25em;
    outline: none;
    border: 2px solid var(--main-fg-color);
    box-shadow: 5px 5px 0 0 var(--main-fg-color);
    text-align: center;
  }

  input:focus {
    outline: 0.5px solid var(--accent-color-1);
    box-shadow: 3px 3px 0 0 var(--accent-color-1);
  }

  input,
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: textfield;
  }
</style>

<script>
  import Button from "./Button.svelte";

  export let value,
    increments = [-1, 1];
</script>

<div>
  <span><slot /></span>
  <div>
    {#each increments.slice(0, increments.length / 2) as increment}
      <Button on:click="{() => (value += increment)}">{increment}</Button>
    {/each}
    <input bind:value type="number" pattern="[0-9]*" inputmode="numeric" />
    {#each increments.slice(increments.length / 2) as increment}
      <Button on:click="{() => (value += increment)}">+{increment}</Button>
    {/each}
  </div>
</div>
