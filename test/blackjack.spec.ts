import {
  Action,
  buildNewDeck,
  dealerExecute,
  GameState,
  getCountForGame,
  getScores,
  isBlackJack,
  reducer
} from "../src/blackjack/blackjack";
import { concat, flatten, range } from "lodash";

describe("blackjack tests", () => {
  test("build new deck", () => {
    expect(buildNewDeck().sort()).toEqual(
      flatten([
        concat(range(1, 10), 10, 10, 10, 10),
        concat(range(1, 10), 10, 10, 10, 10),
        concat(range(1, 10), 10, 10, 10, 10),
        concat(range(1, 10), 10, 10, 10, 10)
      ]).sort()
    );
  });

  test("getScores doesn't mutate input", () => {
    const input = [10, 3, 4];
    const x = getScores(input);
    expect(getScores(input)).toEqual([17]);
    expect(input).toEqual([10, 3, 4]);

    const inputBust = [10, 8, 6];
    expect(getScores(inputBust)).toEqual([]);
    expect(inputBust).toEqual([10, 8, 6]);
  });

  test("getScores handles no aces", () => {
    expect(getScores([2, 3])).toEqual([5]);
    expect(getScores([10, 10])).toEqual([20]);
  });

  test("getScores handles aces", () => {
    expect(getScores([2, 3, 1])).toEqual([6, 16]);
    expect(getScores([10, 10, 1])).toEqual([21]);
  });

  test("getScores handles busts", () => {
    expect(getScores([2, 10, 7, 1, 1])).toEqual([21]);
    expect(getScores([10, 10, 2])).toEqual([]);
  });

  test("isBlackJack returns true for blackjack", () => {
    expect(isBlackJack([10, 1])).toBe(true);
    expect(isBlackJack([1, 10])).toBe(true);
    expect(isBlackJack([1, 1])).toBe(false);
    expect(isBlackJack([1, 10, 1])).toBe(false);
  });

  test("getCount doesn't mutate input", () => {
    const deck = [3, 4, 5, 6, 2, 10, 10, 10, 10, 1];
    const dealerCards = [8, 8];
    expect(
      getCountForGame({
        deck,
        dealerCards,
        bet: 0,
        state: GameState.PlayerAction,
        cash: 0,
        playerCards: []
      })
    ).toBe(0);
    expect(deck).toEqual([3, 4, 5, 6, 2, 10, 10, 10, 10, 1]);
    expect(dealerCards).toEqual([8, 8]);
  });

  test("getCount returns the correct count with a counted card in dealerCards[1]", () => {
    const deck = [3, 4];
    const dealerCards = [8, 5];
    expect(
      getCountForGame({
        deck,
        dealerCards,
        bet: 0,
        state: GameState.PlayerAction,
        cash: 0,
        playerCards: []
      })
    ).toBe(3);
  });

  test("getCount returns the correct count with a not-counted card in dealerCards[1]", () => {
    const deck = [3, 4];
    const dealerCards = [5, 9];
    expect(
      getCountForGame({
        deck,
        dealerCards,
        bet: 0,
        state: GameState.PlayerAction,
        cash: 0,
        playerCards: []
      })
    ).toBe(2);
  });

  test("dealerExecute doesn't mutate input", () => {
    const deck = [2, 2, 2, 2, 5];
    const dealerHand = [4];

    const [newDeck, newDealerHand] = dealerExecute(deck, dealerHand);
    expect(deck).toEqual([2, 2, 2, 2, 5]);
    expect(dealerHand).toEqual([4]);
    expect(newDeck).toEqual([]);
    expect(newDealerHand).toEqual([4, 2, 2, 2, 2, 5]);
  });

  test("dealerExecute handles Aces", () => {
    const deck = [1, 2, 2, 2, 2, 5];
    const dealerHand = [4];

    const [newDeck, newDealerHand] = dealerExecute(deck, dealerHand);
    expect(newDeck).toEqual([2, 2, 2, 5]);
    expect(newDealerHand).toEqual([4, 1, 2]);
  });

  test("reducer bet action doesn't mutate inputs", () => {
    const deck = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1];
    const game = {
      bet: 0,
      deck,
      state: GameState.Bet,
      cash: 100,
      playerCards: [] as number[],
      dealerCards: [] as number[]
    };
    const {
      state,
      bet,
      playerCards,
      dealerCards,
      deck: newDeck,
      cash
    } = reducer(game, {
      type: "bet",
      value: 10
    });
    expect(deck).toEqual(concat(range(1, 11), 1));
    expect(state).toBe(GameState.PlayerAction);
    expect(bet).toBe(10);
    expect(playerCards).toEqual([1, 2]);
    expect(dealerCards).toEqual([3, 4]);
    expect(newDeck).toEqual([5, 6, 7, 8, 9, 10, 1]);
    expect(cash).toBe(90);
  });

  test("reducer player action Stay doesn't mutate inputs", () => {
    const deck = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1];
    const game = {
      bet: 10,
      deck,
      state: GameState.PlayerAction,
      cash: 100,
      playerCards: [10, 4] as number[],
      dealerCards: [3, 8] as number[]
    };
    const {
      state,
      bet,
      playerCards,
      dealerCards,
      deck: newDeck,
      cash
    } = reducer(game, {
      type: "player",
      action: Action.Stay
    });
    expect(deck).toEqual(concat(range(1, 11), 1));
    expect(state).toBe(GameState.Settle);
    expect(bet).toBe(10);
    expect(playerCards).toEqual([10, 4]);
    expect(dealerCards).toEqual([3, 8, 1, 2, 3]);
    expect(newDeck).toEqual([4, 5, 6, 7, 8, 9, 10, 1]);
    expect(cash).toBe(100);
  });

  test("reducer player action Hit doesn't mutate inputs with no bust", () => {
    const deck = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1];
    const game = {
      bet: 10,
      deck,
      state: GameState.PlayerAction,
      cash: 100,
      playerCards: [1, 4] as number[],
      dealerCards: [10, 3] as number[]
    };
    const {
      state,
      bet,
      playerCards,
      dealerCards,
      deck: newDeck,
      cash
    } = reducer(game, {
      type: "player",
      action: Action.Hit
    });
    expect(deck).toEqual(concat(range(1, 11), 1));
    expect(state).toBe(GameState.PlayerAction);
    expect(bet).toBe(10);
    expect(playerCards).toEqual([1, 4, 1]);
    expect(dealerCards).toEqual([10, 3]);
    expect(newDeck).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 1]);
    expect(cash).toBe(100);
  });

  test("reducer player action Hit doesn't mutate inputs with bust", () => {
    const deck = [10, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1];
    const game = {
      bet: 10,
      deck,
      state: GameState.PlayerAction,
      cash: 100,
      playerCards: [10, 4] as number[],
      dealerCards: [10, 3] as number[]
    };
    const {
      state,
      bet,
      playerCards,
      dealerCards,
      deck: newDeck,
      cash
    } = reducer(game, {
      type: "player",
      action: Action.Hit
    });
    expect(deck).toEqual(concat(10, range(2, 11), 1));
    expect(state).toBe(GameState.Settle);
    expect(bet).toBe(10);
    expect(playerCards).toEqual([10, 4, 10]);
    expect(dealerCards).toEqual([10, 3]);
    expect(newDeck).toEqual(concat(range(2, 11), 1));
    expect(cash).toBe(100);
  });

  test("reducer settle doesn't mutate inputs with player win", () => {
    const deck = [10, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1];
    const game = {
      bet: 10,
      deck,
      state: GameState.Settle,
      cash: 100,
      playerCards: [10, 8] as number[],
      dealerCards: [10, 7] as number[]
    };
    const {
      state,
      bet,
      playerCards,
      dealerCards,
      deck: newDeck,
      cash
    } = reducer(game, {
      type: "settle",
    });
    expect(deck).toEqual(concat(10, range(2, 11), 1));
    expect(state).toBe(GameState.Bet);
    expect(bet).toBe(0);
    expect(playerCards).toEqual([]);
    expect(dealerCards).toEqual([]);
    expect(newDeck).toEqual(deck);
    expect(cash).toBe(120);
  });

  test("reducer settle doesn't mutate inputs with player lose", () => {
    const deck = [10, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1];
    const game = {
      bet: 10,
      deck,
      state: GameState.Settle,
      cash: 100,
      playerCards: [10, 7] as number[],
      dealerCards: [10, 8] as number[]
    };
    const {
      state,
      bet,
      playerCards,
      dealerCards,
      deck: newDeck,
      cash
    } = reducer(game, {
      type: "settle",
    });
    expect(deck).toEqual(concat(10, range(2, 11), 1));
    expect(state).toBe(GameState.Bet);
    expect(bet).toBe(0);
    expect(playerCards).toEqual([]);
    expect(dealerCards).toEqual([]);
    expect(newDeck).toEqual(deck);
    expect(cash).toBe(100);
  });
  test("reducer settle doesn't mutate inputs with push", () => {
    const deck = [10, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1];
    const game = {
      bet: 10,
      deck,
      state: GameState.Settle,
      cash: 100,
      playerCards: [10, 8] as number[],
      dealerCards: [10, 8] as number[]
    };
    const {
      state,
      bet,
      playerCards,
      dealerCards,
      deck: newDeck,
      cash
    } = reducer(game, {
      type: "settle",
    });
    expect(deck).toEqual(concat(10, range(2, 11), 1));
    expect(state).toBe(GameState.Bet);
    expect(bet).toBe(0);
    expect(playerCards).toEqual([]);
    expect(dealerCards).toEqual([]);
    expect(newDeck).toEqual(deck);
    expect(cash).toBe(110);
  });
});
