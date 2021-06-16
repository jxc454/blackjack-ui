// array of tuples
// [cardCount, Card[][]), sorted high-to-low by cardCount
import { groupBy, sum, toPairs } from "lodash";
import Node from "../hit_stay_only/trie_node";
import {getScore, getStayEv} from "../hit_stay_only/helpers";

export interface hitParams {
  hands: number[][];
  deck: number[];
  playerHand: number[];
  dealerCard: number;
  deckMap: Map<number, number>;
}

export function hit({
  hands,
  deck,
  playerHand,
  dealerCard,
  deckMap
}: hitParams): number {
  const handsMap: Array<[string, number[][]]> = toPairs(
    groupBy(hands, "length")
  ).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

  const evs = new Node();

  handsMap.push(["0", [[]]]);
  for (const [_, hands] of handsMap) {
    // need to process all of these hands and store the expected values in the trie
    for (const hand of hands) {
      // decrement the deck with the values in this hand
      hand.forEach(card => deckMap.set(card, deckMap.get(card)! - 1));

      let handHitEv = 0;

      // this is how we get the expected values for each hand
      deckMap.forEach((count, cardValue) => {
        if (count <= 0) {
          // there aren't actually any instance of this card in the deck, so skip this case
          return;
        }
        // add this card to the original hand, plus the hand here
        const allCards = hand.concat(playerHand).concat(cardValue);

        // remove this card from the deck
        deckMap.set(cardValue, deckMap.get(cardValue)! - 1);

        const bestPlayerHand = getScore(allCards);

        if (bestPlayerHand > 21) {
          // bust!  no need for dealer to do anything, just put the card back
          deckMap.set(cardValue, deckMap.get(cardValue)! + 1);
          handHitEv += -1 * count;
          return;
        }

        if (bestPlayerHand < 21) {
          // look up this hand
          const expectedHit = evs.findFinal(
            hand.concat(cardValue).sort((a, b) => b - a)
          )!;
          handHitEv += expectedHit * count;
        }

        // put the card back
        deckMap.set(cardValue, deckMap.get(cardValue)! + 1);
      });

      // now calculate the STAY percentage
      const handStayEv = getStayEv(
        dealerCard!,
        getScore(hand.concat(playerHand)),
        deckMap
      );

      evs.addPath(
        hand,
        Math.max(handHitEv / sum(Array.from(deckMap.values())), handStayEv)
      );

      // put the hand cards back
      hand.forEach(card => deckMap.set(card, deckMap.get(card)! + 1));
    }
  }

  return (
    sum(
      Array.from(deckMap.entries()).map(
        ([cardValue, count]) => (evs.findFinal([cardValue]) || -1) * count
      )
    ) / deck.length
  );
}
