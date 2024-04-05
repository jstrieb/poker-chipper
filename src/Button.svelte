<style>
  button {
    cursor: pointer;
    padding: 0.5em 0.25em;
    border: 2px solid var(--main-fg-color);
    box-shadow: 3px 3px 0 0 var(--main-fg-color);
    user-select: none;
    -webkit-user-select: none;
  }

  button:hover {
    outline: 1px solid var(--main-fg-color);
  }

  button:active {
    box-shadow: 2px 2px 0 0 var(--main-fg-color);
  }
</style>

<button {...$$props} {...$$restProps} on:click on:hover>
  <slot />
</button>
