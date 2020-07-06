import {
  Action,
  bestScore,
  buildNewDeck,
  Game,
  GameState,
  reducer
} from "./blackjack";
import { concat } from "lodash";
import {
  addDealerCardNoBlackJack,
  alignDeckWithCount,
  dealCardsFromDeck
} from "./simulator";
import { max } from "lodash";

export type ActionEvaluator = (
  playerCards: number[],
  dealerCards: number[],
  count: number
) => number;

export function evaluateSettled(game: Game): number {
  if (game.state !== GameState.Settle) {
    throw new Error(
      `evaluateSettled was passed a game with state = ${game.state}.`
    );
  }

  const { playerCards, dealerCards, bet } = game;
  const playerScore = bestScore(playerCards);
  const dealerScore = bestScore(dealerCards);

  if (!playerScore && !dealerScore) {
    throw new Error(
      `evaluateSettled was passed a game with dealerBust and playerBust.`
    );
  }

  return dealerScore > playerScore
    ? 0
    : playerScore > dealerScore
    ? bet * 2
    : bet;
}

const stayReducer: ActionEvaluator = (
  playerCards: number[],
  dealerCards: number[],
  count: number
) => {
    const deck = alignDeckWithCount(
        dealCardsFromDeck(buildNewDeck(), concat(playerCards, dealerCards[0])),
        count
    );

    const [deckMinusDealerCard, secondDealerCard] = addDealerCardNoBlackJack(
        deck,
        dealerCards[0]
    );

    const gameState: Game = {
        deck: deckMinusDealerCard,
        playerCards,
        dealerCards: concat(dealerCards[0], secondDealerCard),
        bet: 1,
        cash: 0,
        state: GameState.PlayerAction
    };

    const newState = reducer(gameState, { type: "player", action: Action.Stay });
    if (newState.state === GameState.Settle) {
        return evaluateSettled(newState);
    }

    throw new Error(
        `stayReducer encountered invalid game state: ${newState.state}`
    );
};

const hitReducer: ActionEvaluator = (
  playerCards: number[],
  dealerCards: number[],
  count: number
) => {
  if (!bestScore(playerCards)) {
    return 0;
  }

  const deck = alignDeckWithCount(
    dealCardsFromDeck(buildNewDeck(), concat(playerCards, dealerCards[0])),
    count
  );

  const [deckMinusDealerCard, secondDealerCard] = addDealerCardNoBlackJack(
    deck,
    dealerCards[0]
  );

  const gameState: Game = {
    deck: deckMinusDealerCard,
    playerCards,
    dealerCards: concat(dealerCards[0], secondDealerCard),
    bet: 1,
    cash: 0,
    state: GameState.PlayerAction
  };

  const newState = reducer(gameState, { type: "player", action: Action.Hit });

  if (newState.state === GameState.Settle) {
    return evaluateSettled(newState);
  }
  if (newState.state === GameState.PlayerAction) {
    return max([
      hitReducer(newState.playerCards, newState.dealerCards, count),
      stayReducer(newState.playerCards, newState.dealerCards, count)
    ]);
  }
  throw new Error(
    `hitReducer encountered invalid game state: ${newState.state}`
  );
};

const doubleDownReducer: ActionEvaluator = (
    playerCards: number[],
    dealerCards: number[],
    count: number
) => {
    const deck = alignDeckWithCount(
        dealCardsFromDeck(buildNewDeck(), concat(playerCards, dealerCards[0])),
        count
    );

    const [deckMinusDealerCard, secondDealerCard] = addDealerCardNoBlackJack(
        deck,
        dealerCards[0]
    );

    const gameState: Game = {
        deck: deckMinusDealerCard,
        playerCards,
        dealerCards: concat(dealerCards[0], secondDealerCard),
        bet: 2,
        cash: 0,
        state: GameState.PlayerAction
    };

    const newState = reducer(gameState, { type: "player", action: Action.DoubleDown });

    if (newState.state === GameState.Settle) {
        return evaluateSettled(newState);
    }

    throw new Error(
        `hitReducer encountered invalid game state: ${newState.state}`
    );
};