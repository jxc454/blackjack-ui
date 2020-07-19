import {
  Action,
  bestScore,
  buildNewDeck,
  Game,
  GameState,
  getCount,
  getScores,
  HandStage,
  reducer
} from "./blackjack";
import { concat, head, last, max, memoize, tail } from "lodash";
import {
  addDealerCardNoBlackJack,
  alignDeckWithCount,
  dealCardsFromDeck
} from "./simulator";
import { Simulate } from "react-dom/test-utils";
import play = Simulate.play;

export type MaybeNumber = number | undefined;

export type ActionEvaluator = (
  playerCards: number[],
  dealerCards: number[],
  count: number
) => number;

export function evaluateSettled(
  hand: number[],
  dealerCards: number[],
  bet: number
): number {
  const playerScore = bestScore(hand);
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

const simulate2: (
  count: number,
  playerCards: number[],
  dealerHole: number
) => {
  hitOutcome: number;
  stayOutcome: number;
  splitOutcome: MaybeNumber;
  doubleDownOutcome: MaybeNumber;
} = memoize(
  (count: number, playerCards: number[], dealerHole: number) => {
    let doubleDownOutcome: MaybeNumber;
    let splitOutcome: MaybeNumber;
    let stayOutcome: number;
    let hitOutcome: number;

    if (bestScore(playerCards) <= 0) {
      return { doubleDownOutcome, splitOutcome, stayOutcome, hitOutcome };
    }

    // deck is missing the cards that are present in the hands, and is aligned with the count
    const deck = alignDeckWithCount(
      dealCardsFromDeck(buildNewDeck(), concat(playerCards, dealerHole)),
      count
    );

    // we need to make sure that the dealer doesn't have blackjack
    // but this card that we deal out here shouldn't be part of the count,
    // because we don't actually know about it, we just know that the dealer's
    // complete hand is not blackjack
    const [deckMinusDealerCard, secondDealerCard] = addDealerCardNoBlackJack(
      deck,
      dealerHole
    );

    // here we have to handle split and double down options
    if (playerCards.length === 2) {
      if (head(playerCards) === last(playerCards)) {
        const splitGameState = reducer(
          {
            dealerPocket: [secondDealerCard],
            dealerHole,
            deck: deckMinusDealerCard,
            hands: [
              { cards: playerCards, bet: 1, stage: HandStage.PlayerAction }
            ],
            cash: 0,
            state: GameState.PlayerAction
          },
          { type: "player", action: Action.Split }
        );

        splitOutcome = splitGameState.hands.reduce((splitTotal, hand) => {
          // if hand is settled, must be BlackJack
          if (hand.stage === HandStage.Settle) {
            return splitTotal + hand.bet + 1.5 * hand.bet;
          }

          // otherwise, branch to hit, stay actions
          const { hitOutcome, stayOutcome } = simulate2(
            getCount(splitGameState.deck),
            hand.cards,
            dealerHole
          );

          return splitTotal + max([hitOutcome, stayOutcome]);
        }, -1);
      }

      const doubleDownGameState = reducer(
        {
          cash: 0,
          dealerHole,
          dealerPocket: [secondDealerCard],
          deck: deckMinusDealerCard,
          hands: [
            { cards: playerCards, bet: 1, stage: HandStage.PlayerAction }
          ],
          state: GameState.PlayerAction
        },
        { type: "player", action: Action.DoubleDown }
      );

      const { hands } = doubleDownGameState;
      const [doubleDownHand] = hands;

      if (doubleDownHand.stage === HandStage.Busted) {
        doubleDownOutcome = -doubleDownHand.bet;
      }

      if (doubleDownHand.stage === HandStage.Settle) {
        const dealerScore = bestScore(
          concat(dealerHole, doubleDownGameState.dealerPocket)
        );
        const playerScore = bestScore(doubleDownHand.cards);

        if (dealerScore > playerScore) {
          doubleDownOutcome = -1;
        } else if (dealerScore < playerScore) {
          doubleDownOutcome = 3;
        } else {
          doubleDownOutcome = 1;
        }
      }
    }

    // handle stay
    const stayGameState = reducer(
      {
        dealerPocket: [secondDealerCard],
        dealerHole,
        deck: deckMinusDealerCard,
        hands: [{ cards: playerCards, bet: 1, stage: HandStage.PlayerAction }],
        cash: 0,
        state: GameState.PlayerAction
      },
      { type: "player", action: Action.Stay }
    );

    const stayDealerScore = bestScore(
      concat(dealerHole, stayGameState.dealerPocket)
    );
    const stayPlayerScore = bestScore(playerCards);

    if (stayDealerScore > stayPlayerScore) {
      stayOutcome = 0;
    } else if (stayDealerScore < stayPlayerScore) {
      stayOutcome = 2;
    } else {
      // push
      stayOutcome = 1;
    }

    // handle hit
    const hitGameState = reducer(
      {
        dealerPocket: [secondDealerCard],
        dealerHole,
        deck: deckMinusDealerCard,
        hands: [{ cards: playerCards, bet: 1, stage: HandStage.PlayerAction }],
        cash: 0,
        state: GameState.PlayerAction
      },
      { type: "player", action: Action.Hit }
    );

    const { hands: hitHands } = hitGameState;
    const [hitHand] = hitHands;

    if (hitHand.stage === HandStage.Busted) {
      hitOutcome = 0;
    } else {
      const { hitOutcome: hit, stayOutcome: stay } = simulate2(
        getCount(hitGameState.deck),
        hitHand.cards,
        dealerHole
      );
      hitOutcome = max([hit, stay]);
    }

    return { hitOutcome, stayOutcome, splitOutcome, doubleDownOutcome };
  },
  (count, playerCards, dealerCards) =>
    `${count}|${getScores(playerCards)}|${playerCards.length === 2}|${
      dealerCards[0]
    }`
);

export default simulate2;
