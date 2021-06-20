import { countBy, round, sum } from "lodash";
import { getScore, getStayEv } from "./helpers";
import { hit } from "../algorithms/hit";
import { bestScore } from "../blackjack/blackjack";
import { split } from "../algorithms/split";

// find all unique hands that could be dealt with these cards to the target value or less
export function getOdds(
  deckInput: number[],
  playerCards: number[],
  dealerCard: number,
  splitOk: boolean = true
): [number, number, number, number] {
  if (bestScore(playerCards) === 21 && playerCards.length === 2) {
    return [1.5, 0, 0, 0];
  }

  const deck = [...deckInput];
  const playerHand = [...playerCards];

  // card value to frequency of card in deck
  const deckDict = countBy(deck);
  const deckMap: Map<number, number> = new Map();

  Object.keys(deckDict).forEach(key =>
    deckMap.set(parseInt(key), deckDict[key])
  );
  // console.log(playerCards, deckInput.length, stringifyMap(deckMap));

  const hitEv = hit({ deck, deckMap, playerHand, dealerCard });

  const splitEv =
    playerCards[0] === playerCards[1] && splitOk
      ? split({
          playerHand: [playerHand[0]],
          dealerCard,
          deck,
          deckMap,
          next: 1
        })
      : -Infinity;

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
