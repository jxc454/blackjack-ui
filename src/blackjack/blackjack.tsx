import React, { useReducer } from "react";
import {
  concat,
  intersection,
  flatMap,
  inRange,
  range,
  max,
  pullAt,
  uniq,
  shuffle
} from "lodash";
import simulate from "./simulator";

export enum GameState {
  Bet,
  PlayerAction,
  Settle
}

export enum Action {
  Hit,
  Stay,
  DoubleDown,
  Split
}

export interface Game {
  state: GameState;
  bet: number;
  playerCards: number[];
  dealerCards: number[];
  deck: number[];
  cash: number;
}

interface BetAction {
  type: "bet";
  value: number;
}

interface PlayerAction {
  type: "player";
  action: Action;
}

interface DealerAction {
  type: "dealer";
}

interface SettleAction {
  type: "settle";
}

export type GameAction = BetAction | PlayerAction | DealerAction | SettleAction;

export const buildNewDeck: () => number[] = () =>
  shuffle(
    flatMap(range(0, 4), () => range(1, 14).map(x => (x >= 10 ? 10 : x)))
  );

const initialState: Game = {
  state: GameState.Bet,
  bet: 0,
  playerCards: [],
  dealerCards: [],
  deck: buildNewDeck(),
  cash: 100
};

export const getScores: (values: number[]) => number[] = (values: number[]) => {
  return uniq(
    values
      .reduce(
        (acc, k) => {
          if (k !== 1) {
            return acc.map(n => n + k);
          }
          return flatMap(acc, n => [1 + n, 11 + n]);
        },
        [0] as number[]
      )
      .filter(value => value <= 21)
  );
};

export const bestScore: (values: number[]) => number = (values: number[]) => {
  return max(getScores(values)) || 0;
};

export const isBlackJack: (values: number[]) => boolean = (
  values: number[]
) => {
  return intersection(values, [1, 10]).length === 2 && values.length === 2;
};

export const getCount: (deck: number[]) => number = (deck: number[]) =>
  deck.reduce(
    (count, k) => count + (k === 10 ? 1 : inRange(k, 3, 7) ? -1 : 0),
    0
  );

export const getCountForGame: (game: Game) => number = (game: Game) =>
  getCount(concat(game.deck, game.dealerCards[1]));

export const dealerExecute: (
  deck: number[],
  dealerHand: number[]
) => [number[], number[]] = (deck: number[], dealerHand: number[]) => {
  const newDealerCards = [...dealerHand];
  const newDeck = [...deck];
  while (newDealerCards.length && max(getScores(newDealerCards)) < 17) {
    newDealerCards.push(pullAt(newDeck, 0)[0]);
  }
  return [newDeck, newDealerCards];
};

export function reducer(game: Game, action: GameAction): Game {
  switch (action.type) {
    case "bet":
      const deck =
        game.deck.length > 10 ? [...game.deck] : shuffle(buildNewDeck());

      const playerCards = pullAt(deck, [0, 1]);
      const dealerCards = pullAt(deck, [0, 1]);

      return {
        ...game,
        bet: action.value,
        deck: deck,
        playerCards,
        dealerCards,
        state:
          isBlackJack(playerCards) || isBlackJack(dealerCards)
            ? GameState.Settle
            : GameState.PlayerAction,
        cash: game.cash - action.value
      };
    case "player":
      if (action.action === Action.Stay) {
        const [newDeck, newDealerCards] = dealerExecute(
          game.deck,
          game.dealerCards
        );
        return {
          ...game,
          deck: newDeck,
          dealerCards: newDealerCards,
          state: GameState.Settle
        };
      }
      if (action.action === Action.DoubleDown) {
        const newPlayerCards = concat(game.playerCards, pullAt(game.deck, 0));
        if (!bestScore(newPlayerCards)) {
          return {
            ...game,
            bet: game.bet * 2,
            playerCards: newPlayerCards,
            state: GameState.Settle,
            cash: game.cash - game.bet
          };
        }
        const [newDeck, newDealerCards] = dealerExecute(
          game.deck,
          game.dealerCards
        );
        return {
          ...game,
          bet: game.bet * 2,
          deck: newDeck,
          dealerCards: newDealerCards,
          playerCards: newPlayerCards,
          state: GameState.Settle,
          cash: game.cash - game.bet
        };
      }


      const newDeck = [...game.deck];
      const newPlayerCards = concat(game.playerCards, pullAt(newDeck, 0));
      const scores = getScores(newPlayerCards);

      return {
        ...game,
        deck: newDeck,
        playerCards: newPlayerCards,
        state: scores.length ? GameState.PlayerAction : GameState.Settle
      };
    case "settle":
      if (isBlackJack(game.playerCards) && !isBlackJack(game.dealerCards)) {
        return {
          ...game,
          playerCards: [],
          dealerCards: [],
          bet: 0,
          state: GameState.Bet,
          cash: game.cash + game.bet * 2.5
        };
      }
      if (
        !game.dealerCards.length ||
        bestScore(game.dealerCards) < bestScore(game.playerCards)
      ) {
        return {
          ...game,
          playerCards: [],
          dealerCards: [],
          bet: 0,
          state: GameState.Bet,
          cash: game.cash + game.bet * 2
        };
      }
      if (
        !game.playerCards.length ||
        bestScore(game.playerCards) < bestScore(game.dealerCards)
      ) {
        return {
          ...game,
          playerCards: [],
          dealerCards: [],
          bet: 0,
          state: GameState.Bet,
          cash: game.cash
        };
      }
      return {
        ...game,
        playerCards: [],
        dealerCards: [],
        bet: 0,
        state: GameState.Bet,
        cash: game.cash + game.bet
      };
  }
}

export default function Blackjack() {
  const [game, dispatch] = useReducer(reducer, initialState);

  switch (game.state) {
    case GameState.Bet:
      return (
        <>
          <div>{`CASH: ${game.cash}`}</div>
          <div>{`COUNT: ${getCountForGame(game)}`}</div>
          <span>BET: </span>
          <button onClick={() => dispatch({ type: "bet", value: 10 })}>
            10
          </button>
          <button onClick={() => dispatch({ type: "bet", value: 25 })}>
            25
          </button>
          <button onClick={() => dispatch({ type: "bet", value: 50 })}>
            50
          </button>
          <br />
        </>
      );
    case GameState.PlayerAction:
      const [hitOutcome, stayOutcome] = simulate(
        getCountForGame(game),
        game.playerCards,
        game.dealerCards
      );

      return (
        <>
          <div>{`CASH: ${game.cash}`}</div>
          <div>{`COUNT: ${getCountForGame(game)}`}</div>
          <div>{`DEALER CARDS: ${game.dealerCards[0]}`}</div>
          <div>{`PLAYER CARDS: ${game.playerCards}`}</div>
          <button
            onClick={() => dispatch({ type: "player", action: Action.Hit })}
          >
            {`HIT: ${hitOutcome}`}
          </button>
          <button
            onClick={() => dispatch({ type: "player", action: Action.Stay })}
          >
            {`STAY: ${stayOutcome}`}
          </button>
          {game.playerCards.length === 2 && (
            <button
              onClick={() =>
                dispatch({ type: "player", action: Action.DoubleDown })
              }
            >
              DOUBLE
            </button>
          )}
          <br />
        </>
      );
    case GameState.Settle:
      const playerScore = bestScore(game.playerCards);
      const dealerScore = bestScore(game.dealerCards);

      return (
        <>
          <div>{`CASH: ${game.cash}`}</div>
          <div>COUNT: NA</div>
          <div>{`DEALER CARDS: ${game.dealerCards}`}</div>
          <div>{`PLAYER CARDS: ${game.playerCards}`}</div>
          <div>
            {playerScore > dealerScore
              ? "YOU WON"
              : dealerScore > playerScore
              ? "YOU LOST"
              : "PUSH"}
          </div>
          <button onClick={() => dispatch({ type: "settle" })}>OK</button>
          <br />
          <br />
        </>
      );
    default:
      return <div>BROKEN</div>;
  }
}
