from itertools import combinations

from pyscipopt import Model

_num_people = 5  # People
_chips = {
    "red": 45,
    "green": 50,
    "blue": 50,
    "white": 47,
    # "black": 47,
}
_chip_value_interval = 5  # Cents
_chips_multiple = 1  # Chips
# _buy_in = (500, 2000)  # Cents range
_buy_in = 1000  # Cents
_buy_in_multiple = 500  # Cents
_blinds = (10, 20)  # Cents (little, big)
# _blinds = None
_preferred_multiple = 25  # Cents

model = Model("main")

def mod(a, b):
    # return a % b; no built-in handler for mod
    q, r = model.addVar(vtype="I"), model.addVar(vtype="I")
    model.addCons(a == q * b + r)
    model.addCons(r <= b - 1)
    return r
    # return a - (b * (a / b))  # Int division

buy_in = model.addVar("buy_in", vtype="I")
model.addCons(buy_in == _buy_in)
model.addCons(mod(buy_in, _buy_in_multiple) == 0)

values = {color: (model.addVar(f"amount_{color}", vtype="I"), model.addVar(f"value_{color}", vtype="I")) for color in _chips.keys()}
for color, (amount, value) in values.items():
    model.addCons(amount >= 1)
    model.addCons(value >= 1)
    model.addCons(mod(value, _chip_value_interval) == 0)
    model.addCons(mod(amount, _chips_multiple) == 0)
    model.addCons(amount * _num_people <= _chips[color])

# Impose a total order
ordered_colors = list(sorted(_chips, key=_chips.get))
for i in range(len(_chips) - 1):
    big_color, small_color = ordered_colors[i], ordered_colors[i + 1]
    big_value, small_value = values[big_color][1], values[small_color][1]
    # The strict inequality constrains guarantee that all values will be unique
    model.addCons(big_value >= small_value + 1)

    # Everything being a multiple (or factor) of everything else is preferable,
    # but not required
    if i < len(_chips) - 2:
        # TODO: Make soft constraint
        # s.add_soft(big_value % small_value == 0)
        model.addCons(mod(big_value, small_value) == 0)
    # People like increments round numbers
    if _preferred_multiple:
        # TODO: Make soft constraint
        # s.add_soft(big_value % _preferred_multiple == 0)
        model.addCons(mod(big_value, _preferred_multiple) == 0)

model.addCons(values[ordered_colors[0]][1] <= buy_in / 5)

if _blinds is not None:
    small, big = _blinds
    model.addCons(values[ordered_colors[-1]][1] == small)

    # TODO: Figure out a way to make sure one of the values is between 1 and
    # three times the big blind

# def sum(l):
    # if len(l) == 0: return 0
    # return l[0] + sum(l[1:])

model.addCons(sum([a * v for a, v in values.values()]) == buy_in)

model.setObjective(sum([a for a, _ in values.values()]))
model.setMaximize()

model.optimize()
status = model.getStatus()

if status == "optimal":
    solution = model.getBestSol()
    print()
    for color in ordered_colors:
        a, v = values[color]
        amount = solution[a]
        value = solution[v]
        value = value / 100
        print(
            f"{int(amount):4} {color:5} chips * ${value:0.2f} each = ${value * amount:0.2f} total"
        )
    b = solution[buy_in] / 100
    print("-" * 45)
    print(f"{'Total buy-in'.center(30)}= ${b:0.2f} total")
else:
    print("Impossible")

