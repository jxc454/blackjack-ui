import { countBy, round, shuffle, sum } from "lodash";
import { getScore, getStayEv } from "./helpers";
import { uniqueHands } from "../helpers/unique_hands";
import { hit } from "../helpers/hit";
import { bestScore } from "../blackjack/blackjack";

// find all unique hands that could be dealt with these cards to the target value or less
export function getOdds(
  deckInput: number[],
  playerCards: number[],
  dealerCard: number,
  splitDepth: number = 2
): [number, number, number, number] {
  if (bestScore(playerCards) === 21) {
    return [1.5, 0, 0, 0];
  }

  const deck = [...deckInput];
  const playerHand = [...playerCards];

  const hands: number[][] = [];
  let total = 21;
  hands.push(...uniqueHands(deck, total - sum(playerHand)));

  // card value to frequency of card in deck
  const deckDict = countBy(deck);
  const deckMap: Map<number, number> = new Map();
  Object.keys(deckDict).forEach(key =>
    deckMap.set(parseInt(key), deckDict[key])
  );

  let splitEv = 0;

  if (playerCards[0] === playerCards[1] && splitDepth) {
    // split is legal
    const iterations = 30;
    let evTotal = 0;

    for (let i = 0; i < iterations; i++) {
      const splitDeck = shuffle(deck);
      const first = splitDeck.pop()!;
      const firstEv = getOdds(
        [...splitDeck],
        [playerCards[0], first],
        dealerCard,
        splitDepth - 1
      );

      const second = splitDeck.pop()!;
      const secondEv = getOdds(
        [...splitDeck],
        [playerCards[1], second],
        dealerCard,
        splitDepth - 1
      );

      // console.log(firstEv);
      // console.log(secondEv);

      splitDeck.push(second, first);
      evTotal = evTotal + Math.max(...firstEv) + Math.max(...secondEv);
    }
    splitEv = evTotal / iterations;
  }

  const hitEv = hit({ hands, deck, playerHand, dealerCard, deckMap });

  // stay ev
  const stayEv = getStayEv(dealerCard!, getScore(playerHand), deckMap);

  // double-down ev
  let ddEv = 0;
  Array.from(deckMap.entries()).forEach(([cardValue, count]) => {
    const handValue = getScore(playerHand.concat(cardValue));
    if (handValue > 21) {
      ddEv -= 2 * count;
      return;
    }
    deckMap.set(cardValue, deckMap.get(cardValue)! - 1);
    ddEv += getStayEv(dealerCard!, handValue, deckMap) * 2 * count;
    deckMap.set(cardValue, deckMap.get(cardValue)! + 1);
  });

  // return [stay, hit, double down]
  return [stayEv, hitEv, ddEv / deck.length, splitEv].map(n => round(n, 2)) as [
    number,
    number,
    number,
    number
  ];
}
