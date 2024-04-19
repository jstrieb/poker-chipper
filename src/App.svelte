<style>
  .main,
  footer {
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
    display: inline-flex;
    border: 1px solid var(--main-fg-color);
    border-radius: 50%;
    box-shadow: 2px 2px 0 0 var(--main-fg-color);
    cursor: pointer;
    margin-right: 0.5ch;
  }

  .underline {
    border-bottom: 2px solid var(--color, var(--main-fg-color));
    padding: 0 0.3ch;
    margin: 0 -0.1ch;
    display: inline-block;
    line-height: 0.9;
  }

  .buttons {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: stretch;
    gap: 1ch;
  }

  details > div {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    gap: 1em;
  }

  summary {
    cursor: pointer;
    user-select: none;
  }

  details[open] summary {
    margin-bottom: 1em;
  }

  .table-container {
    width: 100%;
    max-width: 100%;
    min-height: 8em;
    overflow: auto;
    display: block;
  }

  table {
    width: max-content;
    margin: auto;
    border-collapse: collapse;
  }

  td {
    text-align: center;
    vertical-align: baseline;
    white-space: pre;
    padding: 0.25em clamp(0.25ch, 1vw, 1ch);
  }

  td:first-of-type {
    text-align: left;
  }

  td:nth-last-of-type(2) {
    padding-right: 1ch;
  }

  td:last-of-type {
    padding: 0.25em 0;
  }

  hr {
    border: none;
    border-top: 1.5px solid var(--main-fg-color);
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
    cursor: pointer;
  }

  footer {
    flex-grow: 1;
    justify-content: flex-end;
    text-align: center;
  }
</style>

<script>
  import Button from "./Button.svelte";
  import NumericInput from "./NumericInput.svelte";
  import SolveWorker from "./solveWorker.js?worker";

  import { debounce, dollars } from "./helpers.js";

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
    chipsValueMultiple = 5,
    chipsMultiple = 1,
    buyIn = 1000,
    blinds = {
      small: 10,
      big: 20,
    },
    preferredMultiple = 25,
    preferredMultipleWeight = 1;

  let worker = new SolveWorker();
  let promiseResolved = true,
    resolvePromise = () => {};
  let solutionPromise = new Promise((r) => r());
  const debouncedSolve = debounce((...args) => {
    if (!promiseResolved) {
      worker.terminate();
      resolvePromise();
      worker = new SolveWorker();
    }
    promiseResolved = false;
    solutionPromise = solutionPromise.then(
      () =>
        new Promise((resolve, reject) => {
          // TODO: Handle out of order results from concurrently queued solves
          resolvePromise = resolve;
          worker.onmessage = (e) => {
            const { data } = e;
            if (data.error) {
              console.error(data.error);
              // reject(data.error);
              promiseResolved = true;
              resolve(undefined);
            } else {
              promiseResolved = true;
              resolve(data.data);
            }
          };
          worker.onerror = (e) => {
            console.error(e);
          };
          worker.postMessage(args);
        }),
    );
  }, 200);
  $: debouncedSolve(
    chips,
    numPeople,
    chipsValueMultiple,
    chipsMultiple,
    buyIn,
    blinds,
    preferredMultiple,
    preferredMultipleWeight,
  );

  function select(e) {
    window.getSelection().selectAllChildren(e.target);
  }
</script>

<div class="main">
  <h1>Instructions</h1>
  <div class="instructions">
    <p>Optimally compute poker chip values for a home game.</p>
    <br />
    <ul>
      <li>Drag numbers to change their value</li>
      <li>Use the buttons to add or remove chip colors</li>
      <li>Tap any color to edit it</li>
      <li>Results are computed at the bottom</li>
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
    min="100">Buy In</NumericInput
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
        class:underline="{true}"
        style:--color="{color.toLocaleLowerCase() !== "white"
          ? color
          : "black"}"
        bind:textContent="{color}"
        on:focus="{select}"
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
  <details>
    <summary>Advanced Options</summary>
    <div>
      <NumericInput
        bind:value="{preferredMultiple}"
        display="{dollars}"
        transforms="{{
          round: [{ limit: 10, multiple: 1 }, { multiple: 25 }],
          initialScale: 3,
        }}"
        min="1">Preferred Value Multiple</NumericInput
      >
      <NumericInput
        bind:value="{preferredMultipleWeight}"
        transforms="{{
          round: [{ limit: 10, multiple: 1 }, { multiple: 5 }],
          initialScale: 10,
        }}"
        min="0">Value Multiple Preference Weight</NumericInput
      >
      <NumericInput
        bind:value="{chipsValueMultiple}"
        display="{dollars}"
        transforms="{{
          round: [{ limit: 5, multiple: 1 }, { multiple: 5 }],
          initialScale: 3,
        }}"
        min="1">Required Value Multiple</NumericInput
      >
      <NumericInput
        bind:value="{chipsMultiple}"
        transforms="{{
          round: [{ limit: 10, multiple: 1 }, { multiple: 5 }],
          initialScale: 10,
        }}"
        min="1">Quantity Multiple</NumericInput
      >
    </div>
  </details>

  <h1 style:margin-top="calc(1em + 3px)">Results</h1>

  <div class="table-container">
    <table>
      <tbody>
        {#await solutionPromise}
          <div>Loading...</div>
        {:then solution}
          {#each Object.entries(solution ?? {}) as [color, { amount, value }]}
            <tr>
              <td>
                <button
                  class="chip"
                  style:--color="{color.toLocaleLowerCase()}"
                  on:click="{(e) => e.target.nextElementSibling.focus()}"
                ></button><span
                  contenteditable="true"
                  on:focus="{select}"
                  on:input="{(e) => {
                    const text = e.target.textContent.replaceAll(
                      /[^a-zA-Z]+/g,
                      '',
                    );
                    if (text !== e.target.textContent) {
                      // TODO: Fix cursor reset
                      e.target.textContent = text;
                      e.target.blur();
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
              <td><b>{dollars(amount * value)}</b></td><td>total</td>
            </tr>
          {/each}
          {#if solution}
            <tr><td colspan="7"><hr /></td></tr>
            <tr>
              <td colspan="5"></td>
              <td><b>{dollars(buyIn)}</b></td>
              <td>total</td>
            </tr>
          {:else}
            <div>No valid solution found!</div>
          {/if}
        {/await}
      </tbody>
    </table>
  </div>
</div>
<footer>
  <p>
    Created by <a href="https://jstrieb.github.io">Jacob Strieb</a>.
    <!-- Check out the code <a href="https://github.com/jstrieb/poker-chipper">on GitHub</a>. -->
  </p>
</footer>
