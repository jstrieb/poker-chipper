import { init } from "z3-solver";

function combinations(list, size) {
  if (size == 0) {
    return [[]];
  }
  let result = [];
  for (let i = 0; i < list.length; i++) {
    result = result.concat(
      combinations(list.slice(i + 1), size - 1).map((l) => [list[i]].concat(l)),
    );
  }
  return result;
}

/***
 * We tell the Z3 solver what we need to be true about the chip values and how
 * many to give to each person, as well as what we want to be true. Then, it
 * finds the optimal values for us, subject to an "objective" function we
 * subjectively create.
 */
export async function solve(
  numPeople,
  chips,
  chipsValueInterval,
  chipsMultiple,
  _buyIn,
  buyInMultiple,
  blinds,
  preferredMultiple,
) {
  // TODO: Remove
  console.log("Setting things up...");

  const { Context, em } = await init();
  const { Optimize, Int, Or, Sum } = new Context("main");

  const solver = new Optimize();
  solver.set("timeout", 30 * 1000);

  // TODO: Handle buy in ranges and buy in multiple
  const buyIn = Int.const("buy_in");
  solver.add(buyIn.eq(_buyIn));

  // Make variables to solve for the amount and value of each color
  const values = Object.fromEntries(
    Object.keys(chips).map((color) => [
      color,
      {
        amount: Int.const(`amount_${color}`),
        value: Int.const(`value_${color}`),
      },
    ]),
  );
  Object.entries(values).forEach(([color, { amount, value }]) => {
    // Amounts and values must be greater than zero
    solver.add(amount.gt(0), value.gt(0));
    // Every chip value must be a multiple of this interval (e.g., 25 cents)
    solver.add(value.mod(chipsValueInterval).eq(0));
    // The amount of each color chip given must be a multiple of chips multiple
    solver.add(amount.mod(chipsMultiple).eq(0));
    // The amount of each chip times the number of people getting that many
    // chips must be less than the total number of people
    solver.add(amount.mul(numPeople).le(chips[color]));
  });
  // No two chip colors can have the same value
  combinations(
    Object.values(values).map(({ value }) => value),
    2,
  ).forEach(([v1, v2]) => {
    solver.add(v1.neq(v2));
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
    solver.add(bigValue.gt(smallValue));
    // Everything being a multiple or factor of everything else is preferable,
    // but not required
    if (i < orderedColors.length - 2) {
      solver.addSoft(bigValue.mod(smallValue).eq(0), 1);
    }
    // Increments of round numbers are generally better
    if (preferredMultiple) {
      solver.addSoft(bigValue.mod(preferredMultiple).eq(0), 1);
    }
  });

  // The max value chip should never be more than ~20% of the total buy-in
  solver.add(values[orderedColors[0]].value.le(buyIn.div(5)));

  if (blinds) {
    const { small, big } = blinds;
    // The smallest valued chip should be equal to the small blind
    solver.add(values[orderedColors[orderedColors.length - 1]].value.eq(small));
    // We should be able to create the big blind from (at most) a couple of one
    // of the types of chips
    solver.add(
      Or(
        ...Object.values(values).map(({ value }) =>
          Or(value.eq(big), value.mul(2).eq(big), value.mul(3).eq(big)),
        ),
      ),
    );
  }

  // The chips given to each person must sum to the buy in
  solver.add(
    Sum(
      ...Object.values(values).map(({ amount, value }) => amount.mul(value)),
    ).eq(buyIn),
  );

  // Optimize for giving the maximum number of chips out to people
  solver.maximize(Sum(...Object.values(values).map(({ amount }) => amount)));

  // TODO: Remove
  console.log("Thinking...");

  let result;
  if ((await solver.check()) !== "unsat") {
    const model = solver.model();

    result = Object.fromEntries(
      Object.entries(values).map(([color, { value, amount }]) => [
        color,
        {
          value: model.eval(value).value(),
          amount: model.eval(amount).value(),
        },
      ]),
    );
    result.buy_in = model.eval(buyIn).value();
  } else {
    // TODO
    console.log("Impossible!");
  }

  em.PThread.terminateAllThreads();
  return result;
}
