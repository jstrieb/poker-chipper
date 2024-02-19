<script>
  import { init } from "z3-solver";
  (async () => {
    const { Context } = await init();
    const { Solver, Int } = new Context("main");

    const x = Int.const("x");

    const solver = new Solver();

    solver.add(x.add(1).eq(10));
    await solver.check();
    const model = solver.model();
    console.log(model, model.eval(x).value());
  })();
</script>

<div>Testing!</div>
