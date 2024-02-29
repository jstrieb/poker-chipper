import createSCIP from "./compiled/scip.js";

function buildCip(
  numPeople,
  chips,
  chipsValueInterval,
  chipsMultiple,
  _buyIn,
  buyInMultiple,
  blinds,
  preferredMultiple,
) {
  const variables = [],
    constraints = [];

  function addVar(name, objective) {
    if (name == null) {
      name = `x${variables.length + 1}`;
    }
    variables.push(
      `  [integer] <${name}>: obj=${objective ? 1 : 0}, original bounds=[0,+inf]`,
    );
    return name;
  }

  function addCons(text, type) {
    if (type == null) {
      type = "linear";
    }
    const name = `c${constraints.length + 1}`;
    constraints.push(`  [${type}] <${name}>: ${text};`);
  }

  // Variable mod value
  function mod(a, b) {
    const q = addVar();
    const r = addVar();
    if (typeof b === "number") {
      addCons(`<${a}>[I] -${b}<${q}>[I] -<${r}>[I] == 0`);
      addCons(`<${r}>[I] <= ${b - 1}`);
    } else if (typeof b === "string") {
      addCons(`<${a}>-<${b}>*<${q}>-<${r}>[I] == 0`, "nonlinear");
      addCons(`<${r}>[I] -<${b}>[I] <= -1`);
    }
    return r;
  }

  // TODO: Handle buy in ranges and buy in multiple
  const buyIn = addVar("buy_in");
  addCons(`<${buyIn}>[I] == ${_buyIn}`);
  addCons(`<${mod(buyIn, buyInMultiple)}>[I] == 0`);

  // Make variables to solve for the amount and value of each color
  const values = Object.fromEntries(
    Object.keys(chips).map((color) => [
      color,
      {
        amount: addVar(`amount_${color}`, 1),
        value: addVar(`value_${color}`),
      },
    ]),
  );
  Object.entries(values).forEach(([color, { amount, value }]) => {
    // Amounts and values must be greater than zero
    // TODO: Is this necessary?
    // Every chip value must be a multiple of this interval (e.g., 25 cents)
    addCons(`<${mod(value, chipsValueInterval)}>[I] == 0`);
    // The amount of each color chip given must be a multiple of chips multiple
    addCons(`<${mod(amount, chipsMultiple)}>[I] == 0`);
    // The amount of each chip times the number of people getting that many
    // chips must be less than the total number of chips of that color
    addCons(`+${numPeople}<${amount}>[I] <= ${chips[color]}`);
  });

  // Impose a (semi-arbitrary) total order on the chip colors. Not strictly
  // necessary for the solver, but makes a lot of the constraints a lot easier
  // to express.
  const orderedColors = Object.keys(chips).sort(
    (c1, c2) => chips[c1] - chips[c2],
  );
  orderedColors.slice(0, -1).forEach((big_color, i) => {
    const smallColor = orderedColors[i + 1];
    const bigValue = values[big_color].value;
    const smallValue = values[smallColor].value;
    // Actually impose the order on chip values
    addCons(`<${bigValue}>[I] -<${smallValue}>[I] >= 1`);
    // Everything being a multiple or factor of everything else is preferable,
    // but not required
    // TODO: Figure out how to do soft constraints
    if (i < orderedColors.length - 2) {
      addCons(`<${mod(bigValue, smallValue)}>[I] == 0`);
    }
    // Increments of round numbers are generally better
    if (preferredMultiple) {
      addCons(`<${mod(bigValue, preferredMultiple)}>[I] == 0`);
    }
  });

  // The max value chip should never be more than ~20% of the total buy-in
  addCons(
    `<${values[orderedColors[0]].value}>[I] <= ${Math.floor(_buyIn / 5)}`,
  );

  if (blinds) {
    const { small, big } = blinds;
    // The smallest valued chip should be equal to the small blind
    addCons(
      `<${values[orderedColors[orderedColors.length - 1]].value}>[I] == ${small}`,
    );
    // We should be able to create the big blind from (at most) a couple of one
    // of the types of chips
    // TODO: Disjunction
  }

  // The chips given to each person must sum to the buy in
  addCons(
    `<${buyIn}>-${Object.values(values)
      .map(({ amount, value }) => `<${amount}>*<${value}>`)
      .join("-")} == 0`,
    "nonlinear",
  );

  return `STATISTICS
  Problem name: main
  Variables: ${variables.length} (0 binary, ${variables.length} integer, 0 implicit integer, 0 continuous)
  Constrainst: 0 initial, ${constraints.length} maximal
OBJECTIVE
  Sense: maximize
VARIABLES
${variables.join("\n")}
CONSTRAINTS
${constraints.join("\n")}
END`;
}

/***
 * We tell the solver what we need to be true about the chip values and how many
 * to give to each person, as well as what we want to be true. Then, it finds
 * the optimal values for us, subject to an "objective" function we subjectively
 * create.
 */
export async function solve(...args) {
  const Module = await createSCIP({
    arguments: ["-q", "-c", "quit"],
  });
  const { FS, callMain: main } = Module;
  const cip = buildCip(...args);
  FS.writeFile("model.cip", cip);
  main([
    "-q",
    "-c",
    "read model.cip",
    "-c",
    "optimize",
    "-c",
    "write solution solution.txt",
    "-c",
    "quit",
  ]);
  const rawSolution = new TextDecoder().decode(FS.readFile("solution.txt"));
  FS.unlink("solution.txt");
  const lines = rawSolution.split("\n").slice(2);
  return Object.fromEntries(
    lines
      .map((l) => {
        const m = l.match(/(\w+)\s+(\d+).*/);
        if (m) {
          const [k, v] = m.slice(1);
          return [k, parseInt(v)];
        }
      })
      .filter((x) => x),
  );
}
