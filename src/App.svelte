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
</style>

<script>
  import Button from "./Button.svelte";
  import NumericInput from "./NumericInput.svelte";

  import {
    compose,
    roundToNearestPower,
    roundToNearest,
    scale,
    dollars,
  } from "./helpers.js";
  import { reloadModule, solve } from "./solve.js";

  const colors = ["black", "purple", "yellow", "brown", "gray"];

  let numPeople = 7,
    chips = {
      white: 50,
      red: 50,
      blue: 50,
      green: 50,
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
  <NumericInput bind:value="{numPeople}" min="1" transform="{scale(20)}"
    >Number of Players</NumericInput
  >
  <NumericInput
    bind:value="{buyIn}"
    display="{dollars}"
    transform="{compose(
      roundToNearest(
        { multiple: 1 },
        { limit: 10, multiple: 5 },
        { limit: 50, multiple: 25 },
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
        { multiple: 1 },
        { limit: 5, multiple: 5 },
        { limit: 25, multiple: 25 },
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
        { multiple: 1 },
        { limit: 5, multiple: 5 },
        { limit: 25, multiple: 25 },
      ),
      scale(5),
    )}"
    min="0.05">Small Blind</NumericInput
  >
  <Button
    on:click="{() => {
      chips[colors.shift()] = 50;
    }}">Add Chip Color</Button
  >
  {#each Object.keys(chips) as color}
    <NumericInput
      bind:value="{chips[color]}"
      min="1"
      transform="{compose(
        roundToNearest(
          { multiple: 1 },
          { limit: 10, multiple: 5 },
          { limit: 50, multiple: 25 },
        ),
        scale(3),
      )}"
      >Total Number of {color.slice(0, 1).toLocaleUpperCase() + color.slice(1)} Chips</NumericInput
    >
  {/each}

  <hr />

  {#await solutionPromise}
    <div>Loading...</div>
  {:then solution}
    {#each Object.entries(solution ?? {}).sort(([_a, { value: a }], [_b, { value: b }]) => b - a) as [color, { amount, value }]}
      <div>
        <span class="chip" style:--color="{color}"></span>
        {color.slice(0, 1).toLocaleUpperCase() + color.slice(1)}: {amount} &times;
        {dollars(value)}
        = {dollars(amount * value)}
      </div>
    {:else}
      <div>No valid solution found!</div>
    {/each}
  {/await}
</div>
