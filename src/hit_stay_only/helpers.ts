import { sum } from "lodash";

export function getScore(cards: number[]): number {
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

export function getStayEv(
  dealerStart: number,
  handValue: number,
  deckMap: Map<number, number>
): number {
  function stay(
    curr: number[],
    deckMap: Map<number, number>,
    min: number
  ): number {
    const currSum = sum(curr);
    if (currSum > 21) {
      return 1;
    }

    const score = Math.max(
      currSum,
      curr.includes(1) ? (currSum + 10) % 21 : -Infinity
    );

    if (score >= 17) {
      return Math.min(score > handValue ? -1 : handValue > score ? 1 : 0);
    }

    let ev = 0;
    let totalCards = 0;

    // get all possible card values, recurse for each one
    deckMap.forEach((count, card) => {
      if (card < min || !count) {
        return;
      }

      // decrement, add card
      deckMap.set(card, count - 1);
      curr.push(card);

      ev += count * stay(curr, deckMap, min);
      totalCards += count;

      // increment
      deckMap.set(card, count);
      curr.pop();
    });

    return totalCards ? ev / totalCards : 0;
  }

  const defer: Array<() => void> = [];

  if (dealerStart === 10) {
    const curr = deckMap.get(1)!;
    deckMap.set(1, 0);
    defer.push(() => deckMap.set(1, curr));
  } else if (dealerStart === 1) {
    const curr = deckMap.get(10)!;
    deckMap.set(10, 0);
    defer.push(() => deckMap.set(10, curr));
  }

  const answer = stay([dealerStart], deckMap, 1);
  defer.forEach(fn => fn());
  return answer;
}
