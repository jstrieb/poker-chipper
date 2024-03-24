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

  .buttons {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: stretch;
    gap: 1ch;
  }

  .table-container {
    width: 100%;
    max-width: 100%;
    overflow: auto;
  }

  table {
    width: fit-content;
    margin: auto;
  }

  td {
    text-align: left;
    vertical-align: baseline;
    white-space: pre;
    padding: 0 clamp(0.25ch, 1vw, 1ch);
  }

  td:first-of-type {
    padding-left: 0;
  }

  td:last-of-type {
    width: 100%;
    padding-right: 0;
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

  span {
    text-transform: capitalize;
  }
</style>

<script>
  import Button from "./Button.svelte";
  import NumericInput from "./NumericInput.svelte";

  import { dollars } from "./helpers.js";
  import { reloadModule, solve } from "./solve.js";

  const colors = [
    "white",
    "red",
    "blue",
    "green",
    "black",
    "purple",
    "yellow",
    "brown",
    "gray",
  ];
  let nextColor = 4;

  let numPeople = 7,
    chips = colors.slice(0, nextColor).map((c) => [c, 50]),
    chipsValuemultiple = 5,
    chipsMultiple = 1,
    buyIn = 1000,
    buyInMultiple = 1,
    blinds = {
      small: 10,
      big: 20,
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
      <li>Tap any color name to edit it</li>
      <li>Optimal results are computed live at the bottom</li>
    </ul>
  </div>
  <h1>Inputs</h1>
  <NumericInput
    bind:value="{numPeople}"
    min="1"
    transforms="{{ initialScale: 20 }}">Number of Players</NumericInput
  >
  <NumericInput
    bind:value="{buyIn}"
    display="{dollars}"
    transforms="{{
      round: [
        { limit: 1000, multiple: 100 },
        { limit: 5000, multiple: 500 },
        { multiple: 2500 },
      ],
      initialScale: 1 / 10,
    }}"
    min="1000">Buy In</NumericInput
  >
  <NumericInput
    bind:value="{blinds.big}"
    display="{dollars}"
    transforms="{{
      round: [{ limit: 75, multiple: 5 }, { multiple: 25 }],
      initialScale: 2,
    }}"
    min="5">Big Blind</NumericInput
  >
  <NumericInput
    bind:value="{blinds.small}"
    display="{dollars}"
    transforms="{{
      round: [{ limit: 75, multiple: 5 }, { multiple: 25 }],
      initialScale: 2,
    }}"
    min="5">Small Blind</NumericInput
  >
  {#each chips as [color, value]}
    <NumericInput
      bind:value
      min="1"
      transforms="{{
        round: [
          { limit: 10, multiple: 1 },
          { limit: 50, multiple: 5 },
          { multiple: 25 },
        ],
        initialScale: 4,
      }}"
    >
      Total <span
        contenteditable="true"
        bind:textContent="{color}"
        on:input="{(e) => {
          const text = e.target.textContent.replaceAll(/[^a-zA-Z]+/g, '');
          if (text !== e.target.textContent) {
            // TODO: Fix cursor reset
            color = text;
            e.target.blur();
          }
        }}"
      ></span> Chips</NumericInput
    >
  {/each}
  <div class="buttons">
    <Button
      style="flex-grow: 1; width: 50%;"
      on:click="{() => {
        const newColor = colors[nextColor++ % colors.length];
        chips.push([newColor, chips[chips.length - 1][1]]);
        chips = chips;
      }}">Add Color</Button
    >
    <Button
      style="flex-grow: 1; width: 50%;"
      on:click="{() => {
        if (chips.length > 1) {
          nextColor--;
          chips.pop();
          chips = chips;
        }
      }}">Remove Color</Button
    >
  </div>

  <h1 style:margin-top="calc(1em + 3px)">Results</h1>

  {#await solutionPromise}
    <div>Loading...</div>
  {:then solution}
    <div class="table-container">
      <table>
        <tbody>
          {#each Object.entries(solution ?? {}) as [color, { amount, value }]}
            <tr>
              <td>
                <span class="chip" style:--color="{color.toLocaleLowerCase()}"
                ></span>
                <span
                  contenteditable="true"
                  on:input="{(e) => {
                    const text = e.target.textContent.replaceAll(
                      /[^a-zA-Z]+/g,
                      '',
                    );
                    if (text !== e.target.textContent) {
                      // TODO: Fix cursor reset
                      e.target.blur();
                      color = text;
                    }
                  }}"
                  on:blur="{(e) => {
                    const text = e.target.textContent;
                    chips[chips.map(([c, _]) => c).indexOf(color)][0] = text;
                  }}">{color}</span
                >
              </td>
              <td><b>{amount}</b> chips</td>
              <td>&times;</td>
              <td><b>{dollars(value)}</b> each</td>
              <td>=</td>
              <td><b>{dollars(amount * value)}</b> total</td>
            </tr>
          {:else}
            <div>No valid solution found!</div>
          {/each}
        </tbody>
      </table>
    </div>
  {/await}
</div>
