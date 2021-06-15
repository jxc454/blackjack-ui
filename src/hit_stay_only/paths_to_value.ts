import { countBy, flatMap, groupBy, round, sum, toPairs } from "lodash";
import Node from "./trie_node";
import { getScore, getStayEv } from "./helpers";

// find all unique hands that could be dealt with these cards to the target value or less
export function uniqueHands(cards: number[], target: number): number[][] {
  if (!cards.length) {
    return [];
  }
  if (cards.length === 1) {
    return cards[0] === target ? [cards] : [];
  }

  let state: Array<Node> = Array(target + 1)
    .fill(null)
    .map(() => new Node());

  for (let index = 0; index < cards.length; index++) {
    const inputValue = cards[index];
    if (inputValue > target) {
      continue;
    }

    const currentPaths = state.map(node => node.getAllPaths());

    for (let capacity = state.length - 1; capacity >= 0; capacity--) {
      if (capacity > inputValue) {
        const existing = currentPaths[capacity - inputValue].map(arr =>
          arr.reverse()
        );

        existing.forEach(path => {
          state[capacity].addPath(path.concat(inputValue));
        });
      }

      // handle soft hands
      if (inputValue === 1 && capacity > 11) {
        const existing = currentPaths[capacity - 11].map(arr => arr.reverse());

        existing.forEach(path => {
          state[capacity].addPath(path.concat(1));
        });
      }
    }

    state[inputValue].addPath([inputValue]);
  }

  const all = state[state.length - 1].getAllPaths();
  const topNode = new Node();
  all.forEach(path => {
    path.sort((a, b) => a - b);
    topNode.addPath(path);
  });

  return topNode.getAllPaths();
}

// TODO - move this all to test
// const deckPart = flatMap([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10], card =>
//   Array(4).fill(card)
// );
//
// const deck = shuffle([
//   ...deckPart,
//   ...deckPart,
//   ...deckPart,
//   ...deckPart,
//   ...deckPart,
//   ...deckPart
// ]);

// const playerHand: number[] = [deck.pop()!, deck.pop()!];
// const dealerCard = deck.pop();
// console.log(dealerCard);
// console.log(playerHand);

export function getOdds(
  deckInput: number[],
  playerCards: number[],
  dealerCard: number
): [number, number, number] {
  const deck = [...deckInput];
  const playerHand = [...playerCards];

  const hands: number[][] = [];
  let total = 21;
  while (total - sum(playerHand) > 0) {
    hands.push(
      ...uniqueHands(
        deck.sort((a, b) => b - a),
        total - sum(playerHand)
      )
    );
    total--;
  }
  console.log(`possibilities -> ${flatMap(hands, x => x).length}`);

  // array of tuples
  // [cardCount, Card[][]), sorted high-to-low by cardCount
  const handsMap: Array<[string, number[][]]> = toPairs(
    groupBy(hands, "length")
  ).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

  // card value to frequency of card in deck
  const deckDict = countBy(deck);
  const deckMap: Map<number, number> = new Map();

  Object.keys(deckDict).forEach(key =>
    deckMap.set(parseInt(key), deckDict[key])
  );
  const evs = new Node();

  // hit ev
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
  return [
    stayEv,
    sum(
      Array.from(deckMap.entries()).map(
        ([cardValue, count]) => (evs.findFinal([cardValue]) || -1) * count
      )
    ) / deck.length,
    ddEv / deck.length
  ].map(n => round(n, 2)) as [number, number, number];
}

// V099052896
