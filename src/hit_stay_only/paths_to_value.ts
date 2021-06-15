import { countBy, round, sum } from "lodash";
import { getScore, getStayEv } from "./helpers";
import { uniqueHands } from "../helpers/unique_hands";
import { hit } from "../helpers/hit";

// find all unique hands that could be dealt with these cards to the target value or less

export function getOdds(
  deckInput: number[],
  playerCards: number[],
  dealerCard: number
): [number, number, number] {
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
  return [stayEv, hitEv, ddEv / deck.length].map(n => round(n, 2)) as [
    number,
    number,
    number
  ];
}
