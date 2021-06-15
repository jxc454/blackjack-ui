import React, { useReducer } from "react";
import {
  cloneDeep,
  concat,
  countBy,
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

import Hand from "../app/components/Hand";
import { getOdds } from "../hit_stay_only/paths_to_value";

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
  dealerHole: number;
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
  dealerHole: 0,
  dealerPocket: [],
  deck: [
    ...buildNewDeck(),
    ...buildNewDeck(),
    ...buildNewDeck(),
    ...buildNewDeck()
  ],
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
  while (
    newDealerCards.length &&
    (max(getScores(newDealerCards)) || Infinity) < 17
  ) {
    newDealerCards.push(pullAt(newDeck, 0)[0]);
  }
  return [newDeck, newDealerCards];
};

export function reducer(game: Game, action: GameAction): Game {
  switch (action.type) {
    case "bet":
      const deck =
        game.deck.length > 15
          ? [...game.deck]
          : shuffle([
              ...buildNewDeck(),
              ...buildNewDeck(),
              ...buildNewDeck(),
              ...buildNewDeck()
            ]);

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
        dealerHole: head(dealerCards) || 0,
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
        // FIXME - double down bug where a bust against a dealer bust is a push instead of a player loss
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

        if (newHands.some(({ stage }) => stage === HandStage.PlayerAction)) {
          return {
            ...game,
            deck: newDeck,
            hands: newHands,
            cash: newCash
          };
        }

        if (newHands.every(({ stage }) => stage === HandStage.Busted)) {
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
        const newHands = cloneDeep(game.hands);
        const newDeck = [...game.deck];

        const activeHand = newHands.find(
          ({ stage }) => stage === HandStage.PlayerAction
        );

        if (!activeHand) {
          throw new Error(
            "reducer got 'Action.Split' but found no active hand."
          );
        }

        const [splitCard1, splitCard2] = activeHand.cards;
        const splitHand1 = concat(splitCard1, pullAt(newDeck, 0));
        const splitHand2 = concat(splitCard2, pullAt(newDeck, 0));

        const splitHands = [
          {
            cards: splitHand1,
            bet: activeHand.bet,
            stage: isBlackJack(splitHand1)
              ? HandStage.Settle
              : HandStage.PlayerAction
          },
          {
            cards: splitHand2,
            bet: activeHand.bet,
            stage: isBlackJack(splitHand2)
              ? HandStage.Settle
              : HandStage.PlayerAction
          }
        ];

        const allHands = concat(newHands, splitHands).filter(
          hand => hand !== activeHand
        );

        return {
          ...game,
          deck: newDeck,
          cash: game.cash - activeHand.bet,
          hands: allHands,
          state: allHands.some(({ stage }) => stage === HandStage.PlayerAction)
            ? GameState.PlayerAction
            : GameState.Settle
        };
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

      if (newHands.every(({ stage }) => stage === HandStage.Busted)) {
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
        dealerHole: 0,
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
        dealerHole: 0,
        dealerPocket: [],
        state: GameState.Bet,
        cash:
          game.cash +
          sum(
            game.hands.map(({ cards, bet, stage }) => {
              if (stage === HandStage.Busted) {
                return 0;
              }

              if (isBlackJack(cards)) {
                return bet * 2.5;
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

  throw new Error();
}

export default function Blackjack() {
  const [game, dispatch] = useReducer(reducer, initialState);
  const activeHand = game.hands.find(
    ({ stage }) => stage === HandStage.PlayerAction
  );

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
      const [stayOutcome, hitOutcome, doubleDownOutcome] = getOdds(
        game.deck,
        activeHand?.cards || [],
        game.dealerHole
      );

      return (
        <>
          <div>{`CASH: ${game.cash}`}</div>
          <div>{`COUNT: ${getCountForGame(game)}`}</div>
          <div>{`DEALER CARDS: ${game.dealerHole}`}</div>
          {game.hands.map((hand, index) => {
            const { cards, stage, bet } = hand;
            return (
              <Hand
                key={`${cards.toString()}|${index}`}
                text={`PLAYER CARDS: ${cards} (${bet})${
                  stage === HandStage.Busted
                    ? " - YOU LOST"
                    : isBlackJack(cards)
                    ? " - BLACKJACK"
                    : ""
                }`}
                active={hand === activeHand}
              />
            );
          })}
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
          {activeHand?.cards.length === 2 && (
            <button
              onClick={() =>
                dispatch({ type: "player", action: Action.DoubleDown })
              }
            >
              {`DOUBLE: ${doubleDownOutcome}`}
            </button>
          )}
          {activeHand?.cards.length === 2 &&
            activeHand.cards[0] === activeHand.cards[1] && (
              <button
                onClick={() =>
                  dispatch({ type: "player", action: Action.Split })
                }
              >
                {`SPLIT: ?`}
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
          <div>
            {game.hands.map((hand, index) => {
              const { cards, bet } = hand;
              return (
                <div key={`${cards.toString()}|${index}`}>
                  <Hand
                    text={`PLAYER CARDS: ${cards} (${bet}) ${
                      bestScore(cards) > dealerScore
                        ? ` - ${isBlackJack(cards) ? "BLACKJACK" : "YOU WON"}`
                        : dealerScore > bestScore(cards)
                        ? " - YOU LOST"
                        : " - PUSH"
                    }`}
                    active={hand === activeHand}
                  />
                </div>
              );
            })}
          </div>
          <button onClick={() => dispatch({ type: "settle" })}>OK</button>
          <div>{JSON.stringify(countBy(game.deck))}</div>
          <br />
          <br />
        </>
      );
    default:
      return <div>BROKEN</div>;
  }
}
