import { random, range, sum } from "lodash";

export function getScore(cards: number[]): number {
  // console.log(cards)
  const score1 = sum(cards);
  if (cards.includes(1)) {
    const score2 = score1 + 10;

    if (score1 === 21 || score2 === 21) {
      return 21;
    }

    return Math.max(score1, score2 % 21);
  }

  return score1;
}

export function sampleMap(map: Map<number, number>): number {
  let total = 0;
  map.forEach(v => (total += v));

  const i = random(1, total);
  let sum = 0;

  const entries = Array.from(map.entries());
  for (const [k, v] of entries) {
    sum += v;
    if (sum >= i) {
      map.set(k, map.get(k)! - 1);
      return k;
    }
  }

  return -999;
}

export function dealersTurn(
  dealerStart: number,
  deckMap: Map<number, number>
): number {
  let all = [dealerStart];
  let score = getScore(all);
  ``;
  // if dealerStart is an ace, the first card can't be a 10
  if (dealerStart === 1) {
    const tens = deckMap.get(10);
    deckMap.delete(10);
    all.push(sampleMap(deckMap));
    score = getScore(all);
    deckMap.set(10, tens || 0);
  }

  // if dealerStart is a ten, the first card can't be an ace
  if (dealerStart === 10) {
    const aces = deckMap.get(1);
    deckMap.delete(1);
    all.push(sampleMap(deckMap));
    score = getScore(all);
    deckMap.set(1, aces || 0);
  }

  while (score < 17) {
    // console.log(`dealerScore->${score}`);
    all.push(sampleMap(deckMap));
    score = getScore(all);
  }

  // replace cards
  for (let i = 1; i < all.length; i++) {
    deckMap.set(all[i], deckMap.get(all[i])! + 1);
  }

  return score;
}

export function getStayEv(
  dealerStart: number,
  handValue: number,
  deckMap: Map<number, number>
): number {
  const stayIterations = 250;
  let stayTotal = 0;
  for (const _ of range(0, stayIterations)) {
    const dealerValue = dealersTurn(dealerStart!, deckMap);
    if (dealerValue > 21 || handValue > dealerValue) {
      stayTotal++;
    } else if (dealerValue > handValue) {
      stayTotal--;
    }
  }

  return stayTotal / stayIterations;
}

function removeFromDeck(remove: number[], deck: number[]): number[] {
  remove.forEach(value => {
    const i = deck.findIndex(d => d === value);
    if (value > -1) {
      deck.splice(i, 1);
    }
  });

  return deck;
}
