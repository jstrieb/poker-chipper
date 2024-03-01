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

  hr {
    border: none;
    border-top: 3px solid var(--main-fg-color);
    margin: 1em 0;
  }
</style>

<script>
  import NumericInput from "./NumericInput.svelte";

  import { solve } from "./solve.js";

  const formatter = Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  });
  function dollars(x) {
    return formatter.format(x);
  }

  let numPeople = 7,
    chips = {
      red: 45,
      green: 50,
      blue: 50,
      white: 47,
      black: 47,
    },
    chipsValueInterval = 5,
    chipsMultiple = 1,
    buyIn = 10,
    buyInMultiple = 1,
    blinds = {
      small: 0.1,
      big: 0.2,
    },
    preferredMultiple = 25;
  $: solutionPromise = solve(
    numPeople,
    chips,
    chipsValueInterval,
    chipsMultiple,
    buyIn,
    buyInMultiple,
    blinds,
    preferredMultiple,
  );
</script>

<div class="main">
  <NumericInput bind:value="{numPeople}">Number of Players</NumericInput>
  <NumericInput bind:value="{buyIn}" increments="{[-5, -1, 1, 5]}" step="0.01"
    >Buy In</NumericInput
  >
  <NumericInput
    bind:value="{blinds.big}"
    increments="{[-0.05, 0.05]}"
    step="0.01">Big Blind</NumericInput
  >
  <NumericInput
    bind:value="{blinds.small}"
    increments="{[-0.05, 0.05]}"
    step="0.01">Small Blind</NumericInput
  >

  <hr />

  {#await solutionPromise}
    <div>Loading...</div>
  {:then solution}
    {#each Object.entries(solution ?? {}).sort(([_a, { value: a }], [_b, { value: b }]) => b - a) as [color, { amount, value }]}
      <div>
        {color.slice(0, 1).toLocaleUpperCase() + color.slice(1)}: {amount} x {dollars(
          value,
        )}
        = {dollars(amount * value)}
      </div>
    {:else}
      <div>No valid solution found!</div>
    {/each}
  {/await}
</div>
