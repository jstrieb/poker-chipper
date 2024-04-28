<style>
  details {
    position: relative;
    top: 0;
    left: 0;
  }

  details > div {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    gap: 1em;
    padding-left: 1em;
  }

  summary {
    cursor: pointer;
    -webkit-user-select: none;
    user-select: none;
    list-style: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  /* 
    Must use custom arrows to make them uniform width across browsers. This is
    required to have the left border of expanded details elements be centered
    with the tip of the arrow across browsers. 
  */
  details > summary::before {
    content: "▸";
    display: inline-block;
    text-align: center;
    padding-right: 0.75ch;
    width: 1ch;
    font-family: monospace, monospace;
    transform: scale(1.5) translateY(-0.05em);
  }

  details[open] > summary::before {
    content: "▾";
  }

  details[open] > summary {
    margin-bottom: 0.5em;
  }

  button {
    position: absolute;
    top: 1.75em;
    left: -1px;
    height: calc(100% - 1.75em);
    border: none;
    cursor: pointer;
    -webkit-user-select: none;
    user-select: none;
    width: 1ch;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  button > div {
    height: 100%;
    border-left: 2px dashed var(--main-fg-color);
  }

  button:hover > div {
    border-left: 2px solid var(--main-fg-color);
  }

  button:active > div {
    border-left: 3px solid var(--main-fg-color);
  }
</style>

<script>
  let details;
</script>

<details bind:this="{details}" {...$$props} {...$$restProps}>
  <summary><slot name="summary" /></summary>
  <div>
    <slot />
  </div>
  <button
    on:click="{() => {
      details.removeAttribute('open');
    }}"><div></div></button
  >
</details>
