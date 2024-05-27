<style>
  .main,
  footer {
    max-width: 50ch;
    width: 100%;
    margin: 1em 0;
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

  .buttons {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: stretch;
    gap: 1ch;
  }

  pre {
    overflow-x: auto;
    font-family: monospace, monospace;
    height: 20em;
    resize: vertical;
  }

  .loading {
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 16em;
  }

  .table-container {
    width: 100%;
    max-width: 100%;
    min-height: 10em;
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

  .title {
    margin: 0;
    width: 100%;
    max-width: 50ch;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: center;
    gap: 2ch;
    margin-top: 2em;
  }

  .title h1 {
    flex-grow: 1;
    text-align: center;
    font-size: large;
  }

  .title img {
    width: calc(24px + 10%);
    max-width: 8ch;
  }

  h2 {
    margin: 1em 0;
  }

  ul {
    margin: 0 1em;
  }

  span {
    text-transform: capitalize;
    cursor: pointer;
  }

  a:hover {
    text-decoration-thickness: 2px;
  }

  footer {
    flex-grow: 1;
    justify-content: flex-end;
    text-align: center;
    margin: 2em 0;
  }
</style>

<script>
  import Button from "./Button.svelte";
  import Checkbox from "./Checkbox.svelte";
  import Details from "./Details.svelte";
  import GrowableInput from "./GrowableInput.svelte";
  import NumericInput from "./NumericInput.svelte";

  import SolveWorker from "./solveWorker.js?worker";
  import favicon from "/favicon-light.svg?url";

  import { buildCip } from "./solve.js";
  import {
    debounce,
    dollars,
    select,
    titleCase,
    loadFromLocalStorage,
    percent,
  } from "./helpers.js";

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

  // Note that chipColors is not part of the inputs object because otherwise
  // changing chip colors would force the solver to recalculate, which isn't
  // actually functionally necessary.
  let chipColors =
    loadFromLocalStorage("inputs").chipColors ?? colors.slice(0, 4);
  let inputs = {
    numPeople: 7,
    chipValues: new Array(4).fill(50),
    buyIn: 1000,
    blinds: {
      small: 10,
      big: 20,
    },
    ...loadFromLocalStorage("inputs"),
  };
  let settings = {
    chipsValueMultiple: 5,
    chipsMultiple: 1,
    preferredMultiple: 25,
    preferredMultipleWeight: 1,
    minChipsPerColor: 2,
    buyInRange: 0,
    maxChipPercent: 20,
    previousValueMinMultiple: 25,
    chipsPairwiseMultipleWeight: 10,
    chipsAbove1Multiples1: true,
    smallestChipSmallBlind: true,
    ...loadFromLocalStorage("settings"),
  };

  const debouncedStore = debounce((key, o) => {
    window.localStorage.setItem(key, JSON.stringify(o));
  }, 1000);
  $: debouncedStore("inputs", { ...inputs, chipColors });
  $: debouncedStore("settings", settings);

  const digitRegex = /(\d+)_(\d+)/;
  const urlParams = Array.from(
    new URL(window.location).searchParams.entries(),
  ).filter(([_, s]) => digitRegex.exec(s) != null);
  const solutionFromUrl = urlParams.map(([c, s], i) => {
    let [_, amount, value] = digitRegex.exec(s);
    (amount = parseInt(amount)), (value = parseInt(value));
    return { amount, value, i };
  });
  let displayFromUrl = urlParams?.length;
  $: if (displayFromUrl) {
    chipColors = urlParams.map(([c, _]) => c);
  }

  let worker = new SolveWorker();
  let promiseResolved = true,
    resolvePromise = () => {};
  let solutionPromise = new Promise((r) =>
    r(displayFromUrl ? solutionFromUrl : undefined),
  );
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

  $: if (!displayFromUrl) {
    debouncedSolve(inputs, settings);
  }
  let model;
  $: if (!displayFromUrl) {
    model = buildCip(inputs, settings);
  }

  function urlForSolution(solution) {
    const u = new URL(window.location);
    u.search = new URLSearchParams(
      Object.fromEntries(
        solution.map(({ amount, value }, i) => [
          chipColors[i].toLocaleLowerCase(),
          `${amount}_${value}`,
        ]),
      ),
    );
    return u.toString();
  }

  function solutionText(solution) {
    const total = solution.reduce(
      (a, { amount, value }) => a + amount * value,
      0,
    );
    return (
      solution
        .map(
          ({ amount, value, i }) =>
            `${titleCase(chipColors[i])}: ${amount} chips x ${dollars(value)} each = ${dollars(amount * value)}`,
        )
        .join("\n") +
      "\n------\nTotal: " +
      dollars(total) +
      "\n"
    );
  }
</script>

<div class="title">
  <img src="{favicon}" alt="Poker Chipper logo" />
  <h1>Poker Chipper</h1>
  <img src="{favicon}" alt="Poker Chipper logo" />
</div>

<div class="main">
  {#if !displayFromUrl}
    <h2>Instructions</h2>
    <div class="instructions">
      <p>Optimally compute poker chip values for a home game.</p>
      <br />
      <ul>
        <li>Drag or tap numbers to change their value</li>
        <li>Use the buttons to add or remove chip colors</li>
        <li>Tap any color to edit it</li>
        <li>Expand "advanced options" to configure the solver</li>
        <li>Results are computed at the bottom</li>
      </ul>
    </div>

    <h2>Inputs</h2>
    <NumericInput
      bind:value="{inputs.numPeople}"
      min="1"
      transforms="{{ initialScale: 20 }}">Number of Players</NumericInput
    >
    <NumericInput
      bind:value="{inputs.buyIn}"
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
      bind:value="{inputs.blinds.big}"
      display="{dollars}"
      transforms="{{
        round: [{ limit: 75, multiple: 5 }, { multiple: 25 }],
        initialScale: 2,
      }}"
      min="5">Big Blind</NumericInput
    >
    <NumericInput
      bind:value="{inputs.blinds.small}"
      display="{dollars}"
      transforms="{{
        round: [{ limit: 75, multiple: 5 }, { multiple: 25 }],
        initialScale: 2,
      }}"
      min="5">Small Blind</NumericInput
    >
    {#each inputs.chipValues as value, i}
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
        Total <GrowableInput
          style="
            cursor: pointer; 
            text-transform: capitalize; 
            border-bottom: 2px solid var(--color, var(--main-fg-color)); 
            margin: 0 -0.1ch; 
            display: inline-block; 
            line-height: 0.9;
          "
          --padding="0.3ch"
          --color="{chipColors[i].toLocaleLowerCase() !== 'white'
            ? chipColors[i]
            : 'black'}"
          bind:value="{chipColors[i]}"
          on:focus="{select}"
          on:beforeinput="{(e) => {
            if (e.inputType === 'insertLineBreak') {
              e.target.blur();
            }
            if (e.data && !e.data.match(/^[a-zA-Z]*$/)) {
              e.preventDefault();
              e.target.blur();
            }
          }}"
        /> Chips</NumericInput
      >
    {/each}
    <div class="buttons">
      <Button
        style="flex-grow: 1; width: 50%;"
        on:click="{() => {
          const newColor = colors[chipColors.length % colors.length];
          chipColors.push(newColor);
          inputs.chipValues.push(
            inputs.chipValues[inputs.chipValues.length - 1],
          );
          chipColors = chipColors;
          inputs.chipValues = inputs.chipValues;
        }}">Add Color</Button
      >
      <Button
        style="flex-grow: 1; width: 50%;"
        on:click="{() => {
          if (inputs.chipValues.length > 1) {
            inputs.chipValues.pop();
            inputs.chipValues = inputs.chipValues;
            chipColors.pop();
            chipColors = chipColors;
          }
        }}">Remove Color</Button
      >
    </div>

    <Details>
      <span slot="summary">Advanced Options</span>
      <div style:margin="1em 0">
        <p>
          Poker Chipper picks the best chip values that meet certain
          <b>requirements</b>. Each possible combination of chip values has a
          <b>score</b>. Poker Chipper picks the combination with the highest
          score.
        </p>
        <br />
        <p>
          The settings below either change the requirements for valid chip
          values, or they change how each combination of chip values is scored.
        </p>
      </div>
      <Details>
        <span slot="summary">Requirements</span>
        <NumericInput
          bind:value="{settings.chipsValueMultiple}"
          display="{dollars}"
          transforms="{{
            round: [{ limit: 5, multiple: 1 }, { multiple: 5 }],
            initialScale: 3,
          }}"
          min="1">Chip values must be multiples of:</NumericInput
        >
        <NumericInput
          bind:value="{settings.chipsMultiple}"
          transforms="{{
            round: [{ limit: 10, multiple: 1 }, { multiple: 5 }],
            initialScale: 10,
          }}"
          min="1">Chip quantities must be multiples of:</NumericInput
        >
        <NumericInput
          bind:value="{settings.minChipsPerColor}"
          transforms="{{
            round: [{ limit: 10, multiple: 1 }, { multiple: 5 }],
            initialScale: 10,
          }}"
          min="0">Minimum number of chips per color:</NumericInput
        >
        <NumericInput
          --expected-width="6ch"
          bind:value="{settings.maxChipPercent}"
          display="{(v) => `${percent(v)} of buy in`}"
          transforms="{{
            round: [{ limit: 5, multiple: 1 }, { multiple: 5 }],
            initialScale: 5,
          }}"
          min="0"
          max="100">Largest chip value:</NumericInput
        >
        <NumericInput
          bind:value="{settings.previousValueMinMultiple}"
          display="{percent}"
          transforms="{{
            round: [
              { limit: 10, multiple: 1 },
              { limit: 25, multiple: 5 },
              { multiple: 25 },
            ],
            initialScale: 5,
          }}"
          min="0"
          >Successive chip values must increase by more than:</NumericInput
        >
        <Checkbox bind:checked="{settings.chipsAbove1Multiples1}"
          >Chips above $1 must be multiples of $1</Checkbox
        >
        <Checkbox bind:checked="{settings.smallestChipSmallBlind}"
          >Smallest chip must equal the small blind</Checkbox
        >
      </Details>
      <Details>
        <span slot="summary">Score</span>
        <NumericInput
          bind:value="{settings.preferredMultiple}"
          display="{dollars}"
          transforms="{{
            round: [
              { limit: 10, multiple: 1 },
              { limit: 25, multiple: 5 },
              { multiple: 25 },
            ],
            initialScale: 3,
          }}"
          min="1">Prefer chip values to be multiples of:</NumericInput
        >
        <NumericInput
          bind:value="{settings.preferredMultipleWeight}"
          transforms="{{
            round: [{ limit: 10, multiple: 1 }, { multiple: 5 }],
            initialScale: 10,
          }}"
          min="0"
          >Score bonus per chip value that is a multiple of {dollars(
            settings.preferredMultiple,
          )}:</NumericInput
        >
        <NumericInput
          bind:value="{settings.buyInRange}"
          display="{(v) => `±${dollars(v)}`}"
          transforms="{{
            round: [
              { limit: 5, multiple: 1 },
              { limit: 25, multiple: 5 },
              { limit: 100, multiple: 25 },
              { multiple: 100 },
            ],
            initialScale: 0.5,
          }}"
          min="0">Buy in range:</NumericInput
        >
        <NumericInput
          --expected-width="8ch"
          bind:value="{settings.chipsPairwiseMultipleWeight}"
          display="{(v) => `${percent(v)} of total chips`}"
          transforms="{{
            round: [
              { limit: 5, multiple: 1 },
              { limit: 25, multiple: 5 },
              { multiple: 25 },
            ],
            initialScale: 5,
          }}"
          min="0"
          >Score bonus per chip value that is a multiple of another:</NumericInput
        >
      </Details>
      <Details>
        <span slot="summary">Raw Optimizer Model</span>
        <p>Run the model with <a href="https://www.scipopt.org/">SCIP</a>.</p>
        <pre>{model}</pre>
        <div class="buttons">
          <Button
            style="flex-grow: 1; width: 50%;"
            on:click="{async () => {
              await navigator.clipboard?.writeText(model);
            }}">Copy Model</Button
          >
          <Button
            style="flex-grow: 1; width: 50%;"
            on:click="{() => {
              Object.assign(document.createElement('a'), {
                href: URL.createObjectURL(
                  new Blob([model], { type: 'text/plain' }),
                ),
                download: 'poker_model.cip',
                target: '_blank',
              }).click();
            }}">Download Model</Button
          >
        </div>
      </Details>
      <Button
        on:click="{() => {
          window.localStorage.removeItem('settings');
          window.localStorage.removeItem('inputs');
          window.location.reload();
        }}">Reset All to Default</Button
      >
    </Details>

    <h2 style:margin-top="calc(1em + 3px)">Results</h2>
  {:else}
    <h2>Chips</h2>
  {/if}

  {#await solutionPromise}
    <div class="loading">Loading...</div>
  {:then solution}
    <div class="table-container">
      <table>
        <tbody>
          {#each solution ?? [] as { amount, value, i }}
            <tr>
              <td>
                <button
                  class="chip"
                  style:--color="{chipColors[i]?.toLocaleLowerCase()}"
                  on:click="{(e) => e.target.nextElementSibling.focus()}"
                ></button><GrowableInput
                  style="
                    cursor: pointer; 
                    text-transform: capitalize;
                    text-align: left;
                  "
                  bind:value="{chipColors[i]}"
                  on:focus="{select}"
                  on:beforeinput="{(e) => {
                    if (e.inputType === 'insertLineBreak') {
                      e.target.blur();
                    }
                    if (e.data && !e.data.match(/^[a-zA-Z]*$/)) {
                      e.preventDefault();
                      e.target.blur();
                    }
                  }}"
                />
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
              <td
                ><b
                  >{dollars(
                    solution.reduce(
                      (a, { amount, value }) => a + amount * value,
                      0,
                    ),
                  )}</b
                ></td
              >
              <td>total</td>
            </tr>
          {:else}
            <div class="loading">No valid solution found!</div>
          {/if}
        </tbody>
      </table>
    </div>
    {#if solution && !displayFromUrl}
      <div class="buttons">
        <Button
          style="flex-grow: 1; width: 50%;"
          on:click="{async () => {
            navigator.clipboard?.writeText(
              solutionText(solution) + '\n' + urlForSolution(solution),
            );
          }}">Copy Link to Results</Button
        >
        {#if navigator.share}
          <Button
            style="flex-grow: 1; width: 50%;"
            on:click="{async () => {
              await navigator.share({
                title: 'Optimal poker chip allocation',
                text: solutionText(solution),
                url: urlForSolution(solution),
              });
            }}">Share Results</Button
          >
        {/if}
      </div>
    {:else if displayFromUrl}
      <Button
        on:click="{() => {
          window.location.search = '';
        }}">Calculate New Values</Button
      >
    {/if}
  {/await}
</div>

<footer>
  <p>
    Created by <a href="https://jstrieb.github.io" target="_blank"
      >Jacob Strieb</a
    >.
  </p>
  <p>
    Check out the code <a
      href="https://github.com/jstrieb/poker-chipper"
      target="_blank">on GitHub</a
    >.
  </p>
</footer>
