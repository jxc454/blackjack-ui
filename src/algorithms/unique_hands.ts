export function uniqueHands(cards: number[], target: number): number[][] {
  const result: number[][] = Array(cards.length + 1)
    .fill(null)
    .map(() => []);

  const map = new Map(
    Array.from(
      cards
        .reduce((acc, k) => acc.set(k, (acc.get(k) || 0) + 1), new Map())
        .entries()
    ).sort((a, b) => b[0] - a[0])
  );

  function dfs(
    cardsMap: Map<number, number>,
    soFar: number[],
    min: number
  ): void {
    if (!map.size) {
      return;
    }

    const soFarSum = soFar.reduce((acc, k) => acc + k, 0);

    Array.from(cardsMap.entries()).forEach(([dfsCard, count]) => {
      if (!count || dfsCard < min || soFarSum + dfsCard > target) {
        return;
      }

      // push dfsCard to result
      const next = [dfsCard].concat(soFar);
      result.push(next);

      // decrement
      cardsMap.set(dfsCard, cardsMap.get(dfsCard)! - 1);

      dfs(cardsMap, [...next], dfsCard);

      // increment
      cardsMap.set(dfsCard, cardsMap.get(dfsCard)! + 1);
    });
  }

  dfs(map, [], 0);

  return result.filter(x => x.length);
}
