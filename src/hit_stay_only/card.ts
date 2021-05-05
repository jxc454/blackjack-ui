import { flatMap, shuffle } from "lodash";

export class Card {
  constructor(name: string, value: number) {}
  public name: string;

  public value: number;
}

export class Shoe {
  constructor(decks: number) {
    flatMap(Array(decks).fill(this.buildDeck()), x => x);
  }

  private buildDeck(): Card[] {
    const pips = [2, 3, 4, 5, 6, 7, 8, 9, 10].map(
      n => new Card(n.toString(), n)
    );
    const faces = ["J", "Q", "K"].map(name => new Card(name, 10));
    const aces = Array(4)
      .fill("A")
      .map(ace => new Card(ace, 1));

    return pips.concat(faces).concat(aces);
  }

  public cards: Card[];

  deal(n: number): Card[] {
    if (n > this.cards.length) {
      throw new Error("sorry, can't deal that many cards");
    }

    const result = [];
    while (result.length < n) {
      result.push(this.cards.pop());
    }

    return result;
  }
}
