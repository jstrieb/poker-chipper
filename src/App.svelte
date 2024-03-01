<style>
  .main {
    max-width: 50ch;
    width: 100%;
    margin: 2em 0;
    padding: 0 0.5em;
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
      // "black": 47,
    },
    chipsValueInterval = 5,
    chipsMultiple = 1,
    buyIn = 1000,
    buyInMultiple = 500,
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
    buyIn,
    buyInMultiple,
    blinds,
    preferredMultiple,
  ).then(console.log);
</script>

<div class="main">
  <NumericInput bind:value="{numPeople}">Number of Players</NumericInput>
</div>
