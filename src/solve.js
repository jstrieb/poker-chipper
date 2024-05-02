import createSCIP from "./compiled/scip.js";

let modulePromise;
export function reloadModule() {
  modulePromise = createSCIP({
    arguments: ["-q", "-c", "quit"],
  });
}
reloadModule();

export function buildCip(
  { chipValues, numPeople, buyIn, blinds },
  {
    chipsValueInterval,
    chipsMultiple,
    preferredMultiple,
    preferredMultipleWeight,
    minChipsPerColor,
    buyInRange,
  },
) {
  const chips = chipValues.map((v, i) => [`color_${i}`, v]);

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

  function anonLinear(s) {
    return `[linear] <>: ${s}`;
  }

  function addDisjunction(constraints) {
    addCons("disjunction( " + constraints.join(", ") + " )", "disjunction");
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

  // Make variables to solve for the amount and value of each color
  const values = Object.fromEntries(
    chips.map(([color, _]) => [
      color,
      {
        amount: addVar(`amount_${color}`, 1),
        value: addVar(`value_${color}`),
      },
    ]),
  );
  Object.entries(values).forEach(([color, { amount, value }]) => {
    // Amounts and values must be greater than zero
    addCons(`<${amount}>[I] >= ${minChipsPerColor}`);
    addCons(`<${value}>[I] >= 1`);
    // Chips above $1 must be multiples of $1
    addDisjunction(
      [`<${value}>[I] <= 99`, `<${mod(value, 100)}>[I] == 0`].map(anonLinear),
    );
    // Every chip value must be a multiple of this interval (e.g., 25 cents)
    addCons(`<${mod(value, chipsValueInterval)}>[I] == 0`);
    // The amount of each color chip given must be a multiple of chips multiple
    addCons(`<${mod(amount, chipsMultiple)}>[I] == 0`);
    // The amount of each chip times the number of people getting that many
    // chips must be less than the total number of chips of that color
    addCons(
      `+${numPeople}<${amount}>[I] <= ${chips.filter(([c, _]) => c == color)[0][1]}`,
    );
  });

  // Impose a (semi-arbitrary) total order on the chip colors. Not strictly
  // necessary for the solver, but makes a lot of the constraints a lot easier
  // to express.
  const orderedColors = chips
    .slice() // Necessary to avoid destructively mutating the array
    .sort(([c1, v1], [c2, v2]) => v1 - v2)
    .map(([c, _]) => c);
  orderedColors.slice(0, -1).forEach((bigColor, i) => {
    const smallColor = orderedColors[i + 1];
    const bigValue = values[bigColor].value;
    const smallValue = values[smallColor].value;
    // Actually impose the order on chip values
    addCons(`<${bigValue}>[I] -<${smallValue}>[I] >= 1`);
    // Everything being a multiple or factor of everything else is preferable,
    // but not required
    let m = mod(bigValue, smallValue);
    let score = addVar(undefined, 1);
    addDisjunction([
      "[conjunction] <>: conjunction( " +
        [
          `<${m}>[I] == 0`,
          `<${score}>[I] == ${Math.floor(chips.reduce((total, [_, v]) => total + v, 0) / 10)}`,
        ]
          .map(anonLinear)
          .join(", ") +
        " )",
      "[conjunction] <>: conjunction( " +
        [`<${m}>[I] >= 1`, `<${score}>[I] == 0`].map(anonLinear).join(", ") +
        " )",
    ]);
    // Increments of round numbers are generally better
    if (preferredMultiple) {
      m = mod(bigValue, preferredMultiple);
      score = addVar(undefined, 1);
      addDisjunction([
        "[conjunction] <>: conjunction( " +
          [`<${m}>[I] == 0`, `<${score}>[I] == ${preferredMultipleWeight}`]
            .map(anonLinear)
            .join(", ") +
          " )",
        "[conjunction] <>: conjunction( " +
          [`<${m}>[I] >= 1`, `<${score}>[I] == 0`].map(anonLinear).join(", ") +
          " )",
      ]);
    }
  });

  // The buy in falls in a range (possibly single-element)
  // TODO: Add soft constraint to encourage not deviating if possible
  const _buyIn = addVar("buy_in");
  addCons(`<${_buyIn}>[I] <= ${buyIn + buyInRange}`);
  addCons(`<${_buyIn}>[I] >= ${buyIn - buyInRange}`);

  // The max value chip should never be more than ~20% of the total buy-in
  addCons(`<${values[orderedColors[0]].value}>[I] <= ${buyIn / 5}`);

  if (blinds) {
    const { small } = blinds;
    // The smallest valued chip should be equal to the small blind
    addCons(
      `<${values[orderedColors[orderedColors.length - 1]].value}>[I] == ${small}`,
    );
  }
  // We should be able to create the big blind from (at most) a couple of one of
  // the types of chips
  addDisjunction(
    Object.entries(values)
      .map(([_, { value }]) => {
        return [
          `<${value}>[I] == ${blinds.big}`,
          `<${value}>[I] * 2 == ${blinds.big}`,
          `<${value}>[I] * 3 == ${blinds.big}`,
        ];
      })
      .flat()
      .map(anonLinear),
  );

  // The chips given to each person must sum to the buy in
  addCons(
    `<${_buyIn}>[I]-${Object.values(values)
      .map(({ amount, value }) => `<${amount}>*<${value}>`)
      .join("-")} == 0`,
    "nonlinear",
  );

  return `STATISTICS
  Problem name: main
  Variables: ${variables.length} (0 binary, ${variables.length} integer, 0 implicit integer, 0 continuous)
  Constraints: 0 initial, ${constraints.length} maximal
OBJECTIVE
  Sense: maximize
VARIABLES
${variables.join("\n")}
CONSTRAINTS
${constraints.join("\n")}
END
`;
}

/***
 * We tell the solver what we need to be true about the chip values and how many
 * to give to each person, as well as what we want to be true. Then, it finds
 * the optimal values for us, subject to an "objective" function we subjectively
 * create.
 */
export async function solve(inputs, settings) {
  if ([inputs, settings].some((o) => Object.values(o).some((x) => x == null))) {
    return undefined;
  }
  const Module = await modulePromise;
  const { FS, callMain: main } = Module;
  // Build a model file and write it to the virtual filesystem
  const cip = buildCip(inputs, settings);
  // console.log(cip);
  FS.writeFile("model.cip", cip);
  // Run the solver on the model file, write solution to virtual filesystem
  main([
    "-q",
    // "-c",
    // "set limits time 600",
    "-c",
    "read model.cip",
    "-c",
    "optimize",
    "-c",
    "write solution solution.txt",
    "-c",
    "quit",
  ]);
  // TODO: Handle impossible case
  // Read solution from virtual filesystem, remove file, return parsed result
  const rawSolution = new TextDecoder().decode(FS.readFile("solution.txt"));
  // console.log(rawSolution);
  FS.unlink("solution.txt");
  const lines = rawSolution.split("\n").slice(2);
  const solution = Object.fromEntries(
    lines
      .map((l) => {
        const m = l.match(/(\w+)\s+(\d+).*/);
        if (m) {
          const [k, v] = m.slice(1);
          return [k, parseInt(v)];
        }
      })
      .filter((x) => x)
      .filter(([k, _]) => !k.match(/x\d+/)),
  );
  if (Object.entries(solution).length === 0) {
    return undefined;
  }
  const result = new Array(inputs.chipValues.length).fill().map((_, i) => ({
    amount: solution[`amount_color_${i}`] ?? 0,
    value: solution[`value_color_${i}`] ?? 0,
  }));
  result.sort(({ value: a }, { value: b }) => b - a);
  return result;
}
