<style>
  details > div {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    gap: 1em;
    padding-left: 1em;
    border-left: 2px dashed black;
  }

  summary {
    cursor: pointer;
    -webkit-user-select: none;
    user-select: none;
    list-style: none;
    margin-left: calc(-0.5ch + 2px);
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
</style>

<details {...$$props} {...$$restProps}>
  <summary><slot name="summary" /></summary>
  <div>
    <slot />
  </div>
</details>
