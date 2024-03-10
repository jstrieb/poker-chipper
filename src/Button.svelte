<style>
  button {
    cursor: pointer;
    padding: 0.5em 0.25em;
    border: 2px solid var(--main-fg-color);
    box-shadow: 4px 4px 0 0 var(--main-fg-color);
  }

  button:hover {
    outline: 1px solid var(--main-fg-color);
  }

  button:active {
    box-shadow: 3px 3px 0 0 var(--main-fg-color);
  }
</style>

<button {...$$props} {...$$restProps} on:click on:hover>
  <slot />
</button>
