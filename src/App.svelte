<script>
  import { solve } from "./solve.js";

  export let callMain, FS;

  const numPeople = 7,
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
  solve(
    callMain,
    FS,
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

<div>Testing!</div>
