from itertools import combinations

from z3 import *

# s = Solver()
s = Optimize()

# TODO: CLI args? Web interface?
# For now, just edit these directly in this file to change the parameters.
_num_people = 7  # People
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

buy_in = Int("buy_in")
if isinstance(_buy_in, tuple):
    s.add(_buy_in[0] <= buy_in, buy_in <= _buy_in[1])
else:
    s.add(buy_in == _buy_in)
s.add(buy_in % _buy_in_multiple == 0)

values = {color: Ints(f"amount_{color} value_{color}") for color in _chips.keys()}
for color, (amount, value) in values.items():
    s.add(amount > 0, value > 0)
    s.add(value % _chip_value_interval == 0)
    s.add(amount % _chips_multiple == 0)
    s.add(amount * _num_people <= _chips[color])

for v1, v2 in combinations((v for _, v in values.values()), 2):
    s.add(v1 != v2)

# Impose a total order
ordered_colors = list(sorted(_chips, key=_chips.get))
for i in range(len(_chips) - 1):
    big_color, small_color = ordered_colors[i], ordered_colors[i + 1]
    big_value, small_value = values[big_color][1], values[small_color][1]
    s.add(big_value > small_value)
    # Everything being a multiple (or factor) of everything else is preferable,
    # but not required
    if i < len(_chips) - 2:
        s.add_soft(big_value % small_value == 0)
    # People like increments round numbers
    if _preferred_multiple:
        s.add_soft(big_value % _preferred_multiple == 0)

# The max value chip should never be more than ~20% of the total buy-in
s.add(values[ordered_colors[0]][1] <= buy_in / 5)

if _blinds is not None:
    small, big = _blinds
    s.add(values[ordered_colors[-1]][1] == small)
    # s.add(Or(*(Or(v == small) for _, v in values.values())))

    # The big blind should be a multiple of a small number of chips
    s.add(Or(*(Or(v == big, v * 2 == big, v * 3 == big) for _, v in values.values())))

# if _blinds:
#     s.add(
#         Or(
#             *(
#                 Or(v1 == 2 * v2, v2 == 2 * v1)
#                 for (v1, v2) in combinations((v for _, v in values.values()), 2)
#             )
#         )
#     )

chip_sum = Sum(*(amount * value for amount, value in values.values()))
s.add(chip_sum == buy_in)

s.maximize(Sum(*(a for a, _ in values.values())))
print(s)
if s.check() == sat:
    # print(s.model())
    model = s.model()
    for color in ordered_colors:
        a, v = values[color]
        amount = model[a].as_long()
        value = model[v].as_long()
        value = value / 100
        print(
            f"{amount:4} {color:5} chips * ${value:0.2f} each = ${value * amount:0.2f} total"
        )
    b = model[buy_in].as_long() / 100
    print("-" * 45)
    print(f"{'Total buy-in'.center(30)}= ${b:0.2f} total")
else:
    print("Impossible! Please adjust options.")
