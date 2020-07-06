import { alignDeckWithCount } from "../src/blackjack/simulator";
import {concat} from "lodash";
import {GameState} from "../src/blackjack/blackjack";
import {evaluateSettled} from "../src/blackjack/simulator2";

describe("simulator tests", () => {
  test("align deck with count doesn't mutate inputs", () => {
    const deck = [1, 2, 3, 4, 2, 3, 4, 5, 10, 10, 10, 10];
    const count = -1;
    const newDeck = alignDeckWithCount(deck, count);

    expect(deck).toEqual([1, 2, 3, 4, 2, 3, 4, 5, 10, 10, 10, 10]);
    expect(newDeck).toEqual([1, 2, 2, 3, 4, 5, 10, 10, 10, 10]);
  });
});

describe("simulator2 tests", () => {
  test("evaluateSettled returns correct value", () => {
    const playerWins = {
      deck: [1],
      playerCards: [6, 1, 1],
      dealerCards: [10, 10, 5],
      bet: 2,
      cash: 0,
      state: GameState.Settle
    };

    const dealerWins = {
      deck: [1],
      playerCards: [6, 1, 1, 10, 6],
      dealerCards: [1],
      bet: 14,
      cash: 0,
      state: GameState.Settle
    };

    const push = {
      deck: [1],
      playerCards: [6, 1, 1],
      dealerCards: [1, 6, 1],
      bet: 5,
      cash: 0,
      state: GameState.Settle
    };

    expect(evaluateSettled(playerWins)).toEqual(4);
    expect(evaluateSettled(dealerWins)).toEqual(0);
    expect(evaluateSettled(push)).toEqual(5);
  });
});