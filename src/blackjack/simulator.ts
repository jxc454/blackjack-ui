import {
  Action,
  buildNewDeck,
  Game,
  GameState,
  getCountForGame,
  isBlackJack,
  reducer,
  bestScore, getCount
} from "./blackjack";
import {
  compact,
  concat,
  inRange,
  findIndex,
  max,
  mean,
  pullAt,
  range,
  round,
  shuffle
} from "lodash";

export const alignDeckWithCount: (deck: number[], count: number) => number[] = (
  deck: number[],
  count: number
) => {
  console.log(`desired count: ${count}`);
  const newDeck: number[] = [];
  let currentCount = getCount(deck);

  for (const card of deck) {
    if (currentCount === count) {
      newDeck.push(card);
    }
    if (currentCount < count) {
      if (card !== 10) {
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
    console.error(deck);
    console.error(`desired count: ${count}`);
    console.error(`current count: ${currentCount}`);
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

const addDealerCard: (deck: number[], card: number) => [number[], number] = (
  deck: number[],
  card: number
) => {
  const newDeck = shuffle([...deck]);
  const indexOfNextCard = findIndex(
    deck,
    innerCard => !isBlackJack(concat(innerCard, card))
  );
  const nextCard = pullAt(newDeck, indexOfNextCard)[0];
  return [compact(newDeck), nextCard];
};

export default function simulate(
  count: number,
  playerCards: number[],
  dealerCards: number[]
): [number, number] {
  if (bestScore(playerCards) <= 0) {
    return [0, 0];
  }

  // create deck
  // deal out player cards, dealer card
  // square deck with count
  // TODO - create a Deck class so these methods can be chained instead of nested
  const deck = alignDeckWithCount(
    dealCardsFromDeck(buildNewDeck(), concat(playerCards, dealerCards[0])),
    count
  );

  const actions = [Action.Hit, Action.Stay];

  const outcomesMatrix = range(0, 15).map(() => {
    // execute each action
    const outcomes = actions.map(action => {
      // TODO - add a card to dealerCards, verify first 2 cards are not blackjack
      const [deckMinusDealerCard, secondDealerCard] = addDealerCard(
        deck,
        dealerCards[0]
      );

      const newGameState: Game = reducer(
        {
          dealerCards: concat(dealerCards[0], secondDealerCard),
          deck: deckMinusDealerCard,
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
          bestScore(newGameState.dealerCards) < bestScore(newGameState.playerCards)
        ) {
          return newGameState.bet * 2;
        }
        // player loses
        if (
          !newGameState.playerCards.length ||
          bestScore(newGameState.playerCards) < bestScore(newGameState.dealerCards)
        ) {
          return 0;
        }
        // push
        return newGameState.bet;
      }

      // play is not settled, simulate on new state
      const x = simulate(
        getCountForGame({...newGameState}),
        newGameState.playerCards,
        dealerCards
      );
      return max([x[0], x[1]]);
    });
    return [outcomes[0], outcomes[1]];
  });

  return [
    round(mean(outcomesMatrix.map(([hit, _]) => hit)), 1),
    round(mean(outcomesMatrix.map(([_, stay]) => stay)), 1)
  ];
}
