<style>
  .main {
    max-width: 50ch;
    width: 100%;
    margin: 2em 0;
    padding: 0 0.5em;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    gap: 1em;
  }

  .chip {
    background: var(--color);
    width: 1em;
    height: 1em;
    display: inline-block;
    border: 1px solid var(--main-fg-color);
    border-radius: 50%;
    position: relative;
    bottom: -0.1em;
    box-shadow: 2px 2px 0 0 var(--main-fg-color);
  }

  hr {
    border: none;
    border-top: 3px solid var(--main-fg-color);
    margin: 1em 0;
  }

  h1 {
    margin: 1em 0;
  }

  h1:first-child {
    margin-top: 0;
  }

  ul {
    margin: 0 1em;
  }
</style>

<script>
  import Button from "./Button.svelte";
  import NumericInput from "./NumericInput.svelte";

  import { compose, roundToNearest, scale, dollars } from "./helpers.js";
  import { reloadModule, solve } from "./solve.js";

  const colors = ["Black", "Purple", "Yellow", "Brown", "Gray"];

  let numPeople = 7,
    chips = {
      White: 50,
      Red: 50,
      Blue: 50,
      Green: 50,
    },
    chipsValuemultiple = 5,
    chipsMultiple = 1,
    buyIn = 10,
    buyInMultiple = 1,
    blinds = {
      small: 0.1,
      big: 0.2,
    },
    preferredMultiple = 25;
  $: solutionPromise = solve(
    chips,
    numPeople,
    chipsValuemultiple,
    chipsMultiple,
    buyIn,
    buyInMultiple,
    blinds,
    preferredMultiple,
  ).catch((e) => {
    console.error(e);
    reloadModule();
  });
</script>

<div class="main">
  <h1>Instructions</h1>
  <div class="instructions">
    <ul>
      <li>Drag or tap numbers to change their value</li>
      <li>Tap the button to add an additional chip color</li>
      <li>Tap any color to edit it</li>
      <li>Optimal results are computed live at the bottom</li>
    </ul>
  </div>
  <h1>Inputs</h1>
  <NumericInput bind:value="{numPeople}" min="1" transform="{scale(20)}"
    >Number of Players</NumericInput
  >
  <NumericInput
    bind:value="{buyIn}"
    display="{dollars}"
    transform="{compose(
      roundToNearest(
        { limit: 10, multiple: 1 },
        { limit: 50, multiple: 5 },
        { multiple: 25 },
      ),
      scale(10),
    )}"
    min="1">Buy In</NumericInput
  >
  <NumericInput
    bind:value="{blinds.big}"
    display="{dollars}"
    transform="{compose(
      (x) => x / 20,
      roundToNearest(
        { limit: 5, multiple: 1 },
        { limit: 25, multiple: 5 },
        { multiple: 25 },
      ),
      scale(5),
    )}"
    min="0.05">Big Blind</NumericInput
  >
  <NumericInput
    bind:value="{blinds.small}"
    display="{dollars}"
    transform="{compose(
      (x) => x / 20,
      roundToNearest(
        { limit: 5, multiple: 1 },
        { limit: 25, multiple: 5 },
        { multiple: 25 },
      ),
      scale(5),
    )}"
    min="0.05">Small Blind</NumericInput
  >
  {#each Object.keys(chips) as color}
    <NumericInput
      bind:value="{chips[color]}"
      min="1"
      transform="{compose(
        roundToNearest(
          { limit: 10, multiple: 1 },
          { limit: 50, multiple: 5 },
          { multiple: 25 },
        ),
        scale(3),
      )}"
    >
      Total {color} Chips</NumericInput
    >
  {/each}
  <Button
    on:click="{() => {
      const newColor = colors.shift();
      if (!(newColor in chips)) {
        chips[newColor] = 50;
      }
    }}">Add Chip Color</Button
  >

  <h1 style:margin-top="calc(1em + 3px)">Results</h1>

  {#await solutionPromise}
    <div>Loading...</div>
  {:then solution}
    {#each Object.entries(solution ?? {}).sort(([_a, { value: a }], [_b, { value: b }]) => b - a) as [color, { amount, value }]}
      <div>
        <span class="chip" style:--color="{color.toLocaleLowerCase()}"></span>
        {color}: {amount} &times;
        {dollars(value)}
        = {dollars(amount * value)}
      </div>
    {:else}
      <div>No valid solution found!</div>
    {/each}
  {/await}
</div>
