export function stringifyMap<A, B>(map: Map<A, B>): string {
  return JSON.stringify(Array.from(map.values()));
}
