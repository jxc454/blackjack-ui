import { alignDeckWithCount } from "../src/blackjack/simulator";

describe("simulator tests", () => {
  test("align deck with count doesn't mutate inputs", () => {
    const deck = [1, 2, 3, 4, 2, 3, 4, 5, 10, 10, 10, 10];
    const count = -1;
    const newDeck = alignDeckWithCount(deck, count);

    expect(deck).toEqual([1, 2, 3, 4, 2, 3, 4, 5, 10, 10, 10, 10]);
    expect(newDeck).toEqual([1, 2, 2, 3, 4, 5, 10, 10, 10, 10]);
  });
});
