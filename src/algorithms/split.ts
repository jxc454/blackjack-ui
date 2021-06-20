import { getOdds } from "../hit_stay_only/paths_to_value";
import { getScore, getStayEv } from "../hit_stay_only/helpers";
import Node from "../hit_stay_only/trie_node";

export interface splitParams {
  deck: number[];
  playerHand: number[];
  dealerCard: number;
  deckMap: Map<number, number>;
  next: number;
}

interface getOdds2HandsParams {
  deck: number[];
  playerHand: number[];
  dealerCard: number;
  deckMap: Map<number, number>;
  next: number;
}

// stringified deckMap -> TrieNode of (sorted) hands
const dp: Map<string, Node> = new Map();

function getOddsMultipleHands({
  playerHand,
  dealerCard,
  deckMap,
  deck,
  next
}: getOdds2HandsParams): number {
  const sortedPlayerHand = [...playerHand].sort((a, b) => a - b);
  const cached = dp.get(deckMap.toString())?.findFinal(sortedPlayerHand);
  // console.log(cached);
  if (cached !== undefined) {
      console.log('HIT CACHE', deckMap.toString(), sortedPlayerHand, cached)
    return cached;
  }

  if (!next) {
    const key = deckMap.toString();
    if (!dp.has(key)) {
      dp.set(key, new Node(-1));
    }
    const best = Math.max(...getOdds(deck, playerHand, dealerCard));
    dp.get(key)!.addPath(sortedPlayerHand, best);
    return best;
  }

  if (getScore(playerHand) > 21) {
    return 0;
  }

  console.log(playerHand, deck.length);

  const deckCopy = [...deck];

  // calculate best second-hand if we stop here with first hand
  let secondEv = 0;
  let totalCards = 0;
  deckMap.forEach((count, cardValue) => {
    // remove current card from deck
    const cardIndex = deckCopy.findIndex(v => v === cardValue)!;
    deckCopy.splice(cardIndex, 1);
    deckMap.set(cardValue, count - 1);

    secondEv += getOddsMultipleHands({
      playerHand: playerHand.concat(cardValue),
      dealerCard,
      deckMap,
      deck,
      next: next - 1
    });
    totalCards += count;

    // put card back in to the deck
    deckCopy.push(cardValue);
    deckMap.set(cardValue, count);
  });

  // stayEv means no more cards for the current hand, plus the best we can do on the rest of the hands
  const stayEv =
    getStayEv(dealerCard, getScore(playerHand), deckMap) +
    secondEv / totalCards;

  let ddEv = -Infinity;
  let splitEv = -Infinity;
  if (playerHand.length === 2) {
    ddEv = 0;
    // for double-down - deal one card, and calculate best second-hand for each
    deckMap.forEach((count, cardValue) => {
      if (!count) {
        return;
      }

      // remove current card from deck
      const cardIndex = deckCopy.findIndex(v => v === cardValue)!;
      deckCopy.splice(cardIndex, 1);
      deckMap.set(cardValue, count - 1);

      let ddOdds =
        2 *
        getStayEv(dealerCard, getScore(playerHand.concat(cardValue)), deckMap);

      // calculate best second-hand since we stopped here with first hand
      let secondEv = split({
        playerHand: playerHand.slice(0, 1),
        dealerCard,
        deckMap,
        deck,
        next: next - 1
      });
      ddOdds += secondEv;
      ddEv += ddOdds / count;

      // put card back in to the deck
      deckCopy.push(cardValue);
      deckMap.set(cardValue, count);
    });

    if (playerHand[0] === playerHand[1] && next < 1) {
      splitEv = 0;
      // for split call split, with next + 1
      splitEv += split({
        playerHand: playerHand.slice(0, 1),
        dealerCard,
        deckMap,
        deck,
        next: next + 1
      });
    }
  }

  let hitEv = 0;
  // for hit...recurse on this function for each card that we could be dealt
  deckMap.forEach((count, cardValue) => {
    if (!count) {
      return;
    }

    // deal a card and recurse

    // remove current card from deck
    const cardIndex = deckCopy.findIndex(v => v === cardValue)!;
    deckCopy.splice(cardIndex, 1);
    deckMap.set(cardValue, count - 1);

    hitEv +=
      getOddsMultipleHands({
        playerHand: playerHand.concat(cardValue),
        dealerCard,
        deckMap,
        deck,
        next
      }) / count;

    // put card back in to the deck
    deckCopy.push(cardValue);
    deckMap.set(cardValue, count);
  });

  const key = deckMap.toString();
  if (!dp.has(key)) {
    dp.set(key, new Node(-1));
  }
  dp.get(key)!.addPath(
    sortedPlayerHand,
    Math.max(stayEv, ddEv, hitEv, splitEv)
  );
  return Math.max(stayEv, ddEv, hitEv, splitEv);
}

export function split({
  playerHand,
  dealerCard,
  deckMap,
  deck,
  next
}: splitParams) {
  let ev = 0;
  const deckCopy = [...deck];

  if (playerHand.length !== 1) {
    throw new Error(
      `split playerHand must have only one card, got ${playerHand}`
    );
  }

  // for each key in deckMap, getOdds and consider the next-hand in the calculation
  deckMap.forEach((count, cardValue) => {
    if (count === 0) {
      return;
    }

    // decrement
    const cardIndex = deckCopy.findIndex(v => v === cardValue)!;
    deckCopy.splice(cardIndex, 1);
    deckMap.set(cardValue, count - 1);

    ev +=
      getOddsMultipleHands({
        playerHand: playerHand.concat(cardValue),
        dealerCard,
        deck: deckCopy,
        deckMap,
        next
      }) * count;

    // increment
    deckCopy.push(cardValue);
    deckMap.set(cardValue, count);
  });

  return ev / deck.length;
}
