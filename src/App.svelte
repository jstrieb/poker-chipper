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
</style>

<script>
  import NumericInput from "./NumericInput.svelte";

  import { solve } from "./solve.js";

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
      small: 10,
      big: 20,
    },
    preferredMultiple = 25;
  $: solve(
    numPeople,
    chips,
    chipsValueInterval,
    chipsMultiple,
    buyIn * 100,
    buyInMultiple,
    blinds,
    preferredMultiple,
  ).then(console.log);
</script>

<div class="main">
  <NumericInput bind:value="{numPeople}">Number of Players</NumericInput>
  <NumericInput bind:value="{buyIn}" increments="{[-5, -1, 1, 5]}" step="0.01"
    >Buy In</NumericInput
  >
</div>
