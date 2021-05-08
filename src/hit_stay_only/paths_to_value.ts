import {
  countBy,
  flatMap,
  flatten,
  groupBy,
  random,
  range,
  shuffle,
  sum,
  toPairs
} from "lodash";
import { Simulate } from "react-dom/test-utils";
import play = Simulate.play;

export class Node {
  constructor(val?: number) {
    this.val = val || -1;
    this.children = null;
  }
  val: number;
  children: Map<number, Node> | null;
  final: number | undefined;

  addPath(input: number[], final?: number): void {
    if (!input.length) {
      this.final = final;
      return;
    }
    if (!this.children) {
      this.children = new Map();
    }
    if (!this.children.has(input[0])) {
      this.children.set(input[0], new Node(input[0]));
    }
    if (input.length === 1) {
      this.children.get(input[0])!.final = final;
    }

    this.children.get(input[0])!.addPath(input.slice(1), final);
  }

  getAllPaths(): number[][] {
    if (!this.children) {
      return [];
    }

    const results: number[][] = [];
    this.children.forEach((v, k) => {
      const subPaths = v.getAllPaths();
      if (!subPaths.length) {
        results.push([k]);
      } else {
        subPaths.forEach(arr => arr.push(k));
        results.push(...subPaths);
      }
    });

    return results;
  }

  findFinal(path: number[]): number | undefined {
    if (!path.length) {
      return this.final;
      // throw new Error("zero length path");
    }
    if (path.length === 1) {
      return this.children?.get(path[0])?.final;
    }

    return this.children?.get(path[0])?.findFinal(path.slice(1));
  }
}

function getScore(cards: number[]): number {
  const score1 = sum(cards);
  if (cards.includes(1)) {
    const score2 = score1 + 10;

    if (score1 === 21 || score2 === 21) {
      return 21;
    }

    return Math.max(score1, score2 % 21);
  }

  return score1;
}

function sampleMap(map: Map<number, number>): number {
  let total = 0;
  map.forEach(v => (total += v));

  const i = random(1, total);
  let sum = 0;

  const entries = Array.from(map.entries());
  for (const [k, v] of entries) {
    sum += v;
    if (sum >= i) {
      map.set(k, map.get(k)! - 1);
      return k;
    }
  }

  return -999;
}

function dealersTurn(
  dealerStart: number,
  deckMap: Map<number, number>
): number {
  let all = [dealerStart];
  let score = getScore(all);

  while (score < 17) {
    // console.log(`dealerScore->${score}`);
    all.push(sampleMap(deckMap));
    score = getScore(all);
  }

  // replace cards
  for (let i = 1; i < all.length; i++) {
    deckMap.set(all[i], deckMap.get(all[i])! + 1);
  }

  return score;
}

function getStayEv(
  dealerStart: number,
  handValue: number,
  deckMap: Map<number, number>
): number {
  const stayIterations = 2500;
  let stayTotal = 0;
  for (const _ of range(0, stayIterations)) {
    const dealerValue = dealersTurn(dealerCard!, deckMap);
    if (dealerValue > 21 || handValue > dealerValue) {
      stayTotal++;
    } else if (dealerValue > handValue) {
      stayTotal--;
    }
  }

  return stayTotal / stayIterations;
}

function removeFromDeck(remove: number[], deck: number[]): number[] {
  remove.forEach(value => {
    const i = deck.findIndex(d => d === value);
    if (value > -1) {
      deck.splice(i, 1);
    }
  });

  return deck;
}

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

const deckPart = shuffle(
  flatMap([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10], card =>
    Array(4).fill(card)
  )
);

const deck = removeFromDeck([1, 10, 9], [...deckPart, ...deckPart]);

const playerHand: number[] = [deck.pop()!, deck.pop()!];
const dealerCard = deck.pop();
// const playerHand = [10, 9];
// const dealerCard = 1;
console.log(dealerCard);
console.log(playerHand);

const hands: number[][] = [];

let total = 21;
while (total - sum(playerHand) > 0) {
  hands.push(...uniqueHands(deck, total - sum(playerHand)));
  total--;
}

// array of tuples
// [cardCount, Card[][]), sorted high-to-low by cardCount
const handsMap: Array<[string, number[][]]> = toPairs(
  groupBy(hands, "length")
).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

// card value to frequency of card in deck
const deckDict = countBy(deck);
const deckMap: Map<number, number> = new Map();

Object.keys(deckDict).forEach(key => deckMap.set(parseInt(key), deckDict[key]));
const eps = new Node();

handsMap.push(["0", [[]]]);
for (const [_, hands] of handsMap) {
  // need to process all of these hands and get the EPs stored in the trie
  for (const hand of hands) {
    // decrement the deck with the values in this hand
    hand.forEach(card => deckMap.set(card, deckMap.get(card)! - 1));

    let handHitEv = 0;

    // now it's like we dealt this hand for real
    // now deal each distinct card in the deck and see how we do
    // this is how we get the HIT values
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
        const expectedHit = eps.findFinal(
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

    eps.addPath(
      hand,
      Math.max(handHitEv / sum(Array.from(deckMap.values())), handStayEv)
    );

    // put the hand cards back
    hand.forEach(card => deckMap.set(card, deckMap.get(card)! + 1));
  }
}

const stayEv = getStayEv(dealerCard!, getScore(playerHand), deckMap);
console.log("stay", stayEv);
console.log(
  "hit",
  sum(
    Array.from(deckMap.entries()).map(
      ([cardValue, count]) => (eps.findFinal([cardValue]) || -1) * count
    )
  ) / sum(Array.from(deckMap.values()))
);
