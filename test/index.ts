import { getOdds } from "../src/hit_stay_only/paths_to_value";
import { buildNewDeck } from "../src/blackjack/blackjack";
import { split } from "../src/algorithms/split";
import { countBy } from "lodash";
console.time("test");
console.log(
  getOdds(
    buildNewDeck()
        .filter(x => ![2, 9].includes(x))
      .concat([2,2,2]),
    [2, 2],
    5
  )
);

const deck = [
  1,
  1,
  1,
  2,
  2,
  2,
  3,
  3,
  3,
  4,
  4,
  4,
  5,
  5,
  5,
  6,
  6,
  6,
  7,
  7,
  7,
  8,
  8,
  8,9,9,
  10,
  10,
  10,
  10,
  10,
  10,
  10,
  10,
  10,
  10,
  10,
  10
];
console.log(
  getOdds(deck.filter(x => ![5, 8].includes(x)).concat([8,8]), [8,9], 5),
  deck.length
);

// const deck = [9, 9, 5, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 10, 10]
//   .filter(x => ![5, 9].includes(x))
//   .concat([]);
// const deckDict = countBy(deck);
// const deckMap: Map<number, number> = new Map();
//
// Object.keys(deckDict).forEach(key => deckMap.set(parseInt(key), deckDict[key]));
//
// console.log(
//   split({
//     deck,
//     deckMap,
//     playerHand: [9],
//     dealerCard: 5,
//     next: 1
//   })
// );
console.timeEnd("test");
