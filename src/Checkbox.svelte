<style>
  label {
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
    white-space: pre-wrap;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: 0.75ch;
  }

  input[type="checkbox"] {
    display: none;
  }

  input[type="checkbox"] + span {
    width: 1em;
    height: 1em;
    border: 2px solid var(--main-fg-color);
    box-shadow: 2px 2px 0 0 var(--main-fg-color);
    box-sizing: content-box;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  label:hover input[type="checkbox"] + span {
    outline: 1px solid var(--main-fg-color);
  }

  input[type="checkbox"]:active + span {
    box-shadow: 1px 1px 0 0 var(--main-fg-color);
  }

  input[type="checkbox"]:checked + span::before {
    content: "";
    box-sizing: border-box;
    display: block;
    /* border: 3px solid var(--main-fg-color); */
    background: var(--main-fg-color);
    width: 0.4em;
    height: 0.4em;
  }
</style>

<script>
  export let checked;
</script>

<label {...$$props} {...$$restProps}
  ><input type="checkbox" bind:checked /><span></span><slot /></label
>
