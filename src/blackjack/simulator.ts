import {
  Action,
  buildNewDeck,
  Game,
  GameState,
  getCount,
  reducer,
  score
} from "./blackjack";
import { concat, inRange, max, pullAt } from "lodash";

const alignDeckWithCount: (deck: number[], count: number) => number[] = (
  deck: number[],
  count: number
) => {
  const newDeck: number[] = [];
  let currentCount = 0;

  for (const card of deck) {
    if (currentCount === count) {
      newDeck.push(card);
    }
    if (currentCount < count) {
      if (!(card === 10)) {
        newDeck.push(card);
      } else {
        currentCount++;
      }
    }
    if (currentCount > count) {
      if (!inRange(card, 3, 7)) {
        newDeck.push(card);
      } else {
        currentCount--;
      }
    }
  }
  if (currentCount !== count) {
    throw new Error("Could not align deck with count.");
  }
  return newDeck;
};

const dealCardsFromDeck: (deck: number[], cards: number[]) => number[] = (
  deck: number[],
  cards: number[]
) => {
  const newDeck = [...deck];
  const indexesToRemove = cards.map(card => deck.indexOf(card));

  pullAt(newDeck, indexesToRemove);
  return newDeck;
};

export default function simulate(
  count: number,
  playerCards: number[],
  dealerCards: number[]
): [number, number] {
  if (score(playerCards) <= 0) {
    return [0, 0];
  }

  // create deck
  // deal out player cards, dealer card
  // square deck with count
  // TODO - create a Deck class so these methods can be chained instead of nested
  const deck = alignDeckWithCount(
    dealCardsFromDeck(buildNewDeck(), concat(playerCards, dealerCards)),
    count
  );

  const actions = [Action.Hit, Action.Stay];

  // execute each action
  const outcomes = actions.map(action => {
    const newGameState: Game = reducer(
      {
        dealerCards: dealerCards,
        deck,
        playerCards,
        bet: 1,
        cash: 0,
        state: GameState.PlayerAction
      },
      { type: "player", action }
    );

    if (newGameState.state == GameState.Settle) {
      // player wins
      if (
        !newGameState.dealerCards.length ||
        score(newGameState.dealerCards) < score(newGameState.playerCards)
      ) {
        return newGameState.bet * 2;
      }
      // player loses
      if (
        !newGameState.playerCards.length ||
        score(newGameState.playerCards) < score(newGameState.dealerCards)
      ) {
        return 0;
      }
      // push
      return newGameState.bet;
    }

    // play is not settled, simulate on new state
    const x = simulate(
      getCount(newGameState),
      newGameState.playerCards,
      newGameState.dealerCards
    );
    return max([x[0], x[1]]);
  });

  return [outcomes[0], outcomes[1]];
}
