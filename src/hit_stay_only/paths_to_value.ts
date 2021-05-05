import { countBy, flatMap, shuffle, sum } from "lodash";
import {Card} from "./card";

export class Node {
  constructor(val?: number) {
    this.val = val || -1
    this.children = null;
  }
  val: number;
  children: Map<number, Node> | null;

  addPath(input: number[]): void {
    if (!input.length) {
      return;
    }
    if (!this.children) {
      this.children = new Map();
    }
    if (!this.children.has(input[0])) {
      this.children.set(input[0], new Node(input[0]));
    }

    this.children.get(input[0]).addPath(input.slice(1));
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
}

export function f(cards: number[], target: number): number[][] {
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
          state[capacity].addPath(path.concat(11));
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

const deck = [...deckPart, ...deckPart];

const hand = [deck.pop(), deck.pop()];
const dealerCard = deck.shift();
console.log(hand);
console.log(dealerCard);

const withLowAces: number[][] = [];

let total = 21;
while (total - sum(hand) > 0) {
  withLowAces.push(...f(deck, total - sum(hand)));
  total--;
}

console.log(countBy(withLowAces, x => x.length));

console.log(`possibilities: ${withLowAces.length}`);
