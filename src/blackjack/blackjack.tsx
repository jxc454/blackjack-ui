import React, { useReducer } from "react";
import {
  cloneDeep,
  concat,
  flatMap,
  head,
  inRange,
  intersection,
  max,
  pullAt,
  range,
  shuffle,
  sum,
  tail,
  uniq
} from "lodash";
// import simulate from "./simulator";
// import { Simulate } from "react-dom/test-utils";

export enum GameState {
  Bet,
  PlayerAction,
  Settle
}

export enum HandStage {
  PlayerAction,
  Settle,
  Busted
}

export enum Action {
  Hit,
  Stay,
  DoubleDown,
  Split
}

export interface Hand {
  cards: number[];
  bet: number;
  stage: HandStage;
}

export interface Game {
  dealerHole: number | undefined;
  dealerPocket: number[];
  state: GameState;
  hands: Hand[];
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
  hands: [],
  dealerHole: undefined,
  dealerPocket: [],
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
  getCount(concat(game.deck, game.dealerHole));

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
        deck: deck,
        hands: [
          {
            bet: action.value,
            cards: playerCards,
            stage: HandStage.PlayerAction
          }
        ],
        dealerHole: head(dealerCards),
        dealerPocket: tail(dealerCards),
        state:
          isBlackJack(playerCards) || isBlackJack(dealerCards)
            ? GameState.Settle
            : GameState.PlayerAction,
        cash: game.cash - action.value
      };
    case "player":
      if (action.action === Action.Stay) {
        const newHands = cloneDeep(game.hands);
        // find first hand with PlayerAction
        const activeHand = newHands.find(
          ({ stage }) => stage === HandStage.PlayerAction
        );

        if (!activeHand) {
          throw new Error(
            "reducer got 'Action.Stay' but found no active hand."
          );
        }

        // set activeHand stage to Settle
        activeHand.stage = HandStage.Settle;

        // total active hands remaining
        const activeHands = newHands.some(
          hand => hand.stage === HandStage.PlayerAction
        );

        if (activeHands) {
          return {
            ...game,
            hands: newHands
          };
        }
        const [newDeck, newDealerCards] = dealerExecute(
          game.deck,
          concat(game.dealerHole, game.dealerPocket)
        );
        return {
          ...game,
          hands: newHands,
          deck: newDeck,
          dealerHole: game.dealerHole,
          dealerPocket: tail(newDealerCards),
          state: GameState.Settle
        };
      }
      if (action.action === Action.DoubleDown) {
        // find first hand with PlayerAction
        const newHands = cloneDeep(game.hands);
        const newDeck = [...game.deck];

        const activeHand = newHands.find(
          hand => hand.stage === HandStage.PlayerAction
        );

        if (!activeHand) {
          throw new Error(
            "reducer got 'Action.DoubleDown' but found no active hand."
          );
        }

        const newCash = game.cash - activeHand.bet;
        activeHand.bet = 2 * activeHand.bet;
        activeHand.cards = concat(activeHand.cards, pullAt(newDeck, 0));
        activeHand.stage = bestScore(activeHand.cards)
          ? HandStage.Settle
          : HandStage.Busted;

        // total active hands remaining
        const activeHands = newHands.some(
          ({ stage }) => stage === HandStage.PlayerAction
        );

        if (activeHands) {
          return {
            ...game,
            deck: newDeck,
            hands: newHands,
            cash: newCash
          };
        }

        if (newHands.every(({ stage }) => HandStage.Busted)) {
          return {
            ...game,
            deck: newDeck,
            hands: newHands,
            cash: newCash,
            state: GameState.Settle
          };
        }

        const [newDeckFinal, newDealerCards] = dealerExecute(
          newDeck,
          concat(game.dealerHole, game.dealerPocket)
        );
        return {
          ...game,
          deck: newDeckFinal,
          dealerPocket: tail(newDealerCards),
          hands: newHands,
          state: GameState.Settle,
          cash: newCash
        };
      }
      if (action.action === Action.Split) {
        // const newDeck = [...game.deck];
        //
        // const [splitCard1, splitCard2] = game.playerCards;
        // const splitHand1 = concat(splitCard1, pullAt(newDeck, 0));
        // const splitHand2 = concat(splitCard2, pullAt(newDeck, 0));
        //
        // return {
        //   ...game,
        //   playerCards: [splitHand1, splitHand2],
        //   deck: newDeck
        // };
      }

      // hit
      // find first hand with PlayerAction
      const newHands = cloneDeep(game.hands);
      const newDeck = [...game.deck];

      const activeHand = newHands.find(
        ({ stage }) => stage === HandStage.PlayerAction
      );

      if (!activeHand) {
        throw new Error("reducer got 'Action.Hit' but found no active hand.");
      }
      activeHand.cards = concat(activeHand.cards, pullAt(newDeck, 0));
      activeHand.stage = bestScore(activeHand.cards)
        ? HandStage.PlayerAction
        : HandStage.Busted;

      // total active hands remaining
      const activeHands = newHands.some(
        ({ stage }) => stage === HandStage.PlayerAction
      );

      if (activeHands) {
        return {
          ...game,
          deck: newDeck,
          hands: newHands
        };
      }

      if (newHands.every(({ stage }) => HandStage.Busted)) {
        return {
          ...game,
          deck: newDeck,
          hands: newHands,
          state: GameState.Settle
        };
      }

      const [newDeckFinal, newDealerCards] = dealerExecute(
        newDeck,
        concat(game.dealerHole, game.dealerPocket)
      );

      return {
        ...game,
        hands: newHands,
        dealerPocket: tail(newDealerCards),
        deck: newDeckFinal,
        state: GameState.Settle
      };
    case "settle":
      const baseNewGame: Game = {
        ...game,
        hands: [],
        dealerHole: undefined,
        dealerPocket: [],
        state: GameState.Bet
      };
      if (isBlackJack(concat(game.dealerHole, game.dealerPocket))) {
        return {
          ...baseNewGame,
          cash:
            game.cash +
            sum(
              game.hands.map(({ cards, bet }) => (isBlackJack(cards) ? bet : 0))
            )
        };
      }

      const dealerScore = bestScore(concat(game.dealerHole, game.dealerPocket));
      if (!dealerScore) {
        return {
          ...baseNewGame,
          cash:
            game.cash +
            sum(
              game.hands.map(({ stage, bet }) =>
                stage === HandStage.Busted ? 0 : bet * 2
              )
            )
        };
      }

      return {
        ...game,
        hands: [],
        dealerHole: undefined,
        dealerPocket: [],
        state: GameState.Bet,
        cash:
          game.cash +
          sum(
            game.hands.map(({ cards, bet, stage }) => {
              if (stage === HandStage.Busted) {
                return 0;
              }

              const playerScore = bestScore(cards);
              if (dealerScore === playerScore) {
                return bet;
              }
              return dealerScore > playerScore ? 0 : bet * 2;
            })
          )
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
      const activeHand = game.hands.find(
        ({ stage }) => stage === HandStage.PlayerAction
      );
      // const [hitOutcome, stayOutcome] = simulate(
      //   getCountForGame(game),
      //   activeHand.cards,
      //   concat(game.dealerHole, game.dealerPocket)
      // );

      const [hitOutcome, stayOutcome] = [0, 0];

      return (
        <>
          <div>{`CASH: ${game.cash}`}</div>
          <div>{`COUNT: ${getCountForGame(game)}`}</div>
          <div>{`DEALER CARDS: ${game.dealerHole}`}</div>
          {game.hands.map(({ cards }, index) => (
            <div
              key={`${cards.toString()}|${index}`}
            >{`PLAYER CARDS: ${cards}`}</div>
          ))}
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
          {activeHand.cards.length === 2 && (
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
      const dealerScore = bestScore(concat(game.dealerHole, game.dealerPocket));

      return (
        <>
          <div>{`CASH: ${game.cash}`}</div>
          <div>COUNT: NA</div>
          <div>{`DEALER CARDS: ${concat(
            game.dealerHole,
            game.dealerPocket
          )}`}</div>
          {game.hands.map(({ cards }, index) => (
            <div key={`${cards.toString()}|${index}`}>
              <span>{`PLAYER CARDS: ${cards}`}</span>
              <span>
                {bestScore(cards) > dealerScore
                  ? " - YOU WON"
                  : dealerScore > bestScore(cards)
                  ? " - YOU LOST"
                  : " - PUSH"}
              </span>
            </div>
          ))}
          <button onClick={() => dispatch({ type: "settle" })}>OK</button>
          <br />
          <br />
        </>
      );
    default:
      return <div>BROKEN</div>;
  }
}
