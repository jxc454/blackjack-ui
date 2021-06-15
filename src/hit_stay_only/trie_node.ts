export default class Node {
  constructor(val?: number) {
    this.val = val || -1;
    this.children = null;
  }
  val: number;
  children: Map<number, Node> | null;
  final: number | undefined;

  addPath(input: number[], final?: number): void {
    if (!input.length) {
      this.final = final;
      return;
    }
    if (!this.children) {
      this.children = new Map();
    }
    if (!this.children.has(input[0])) {
      this.children.set(input[0], new Node(input[0]));
    }
    if (input.length === 1) {
      this.children.get(input[0])!.final = final;
    }

    this.children.get(input[0])!.addPath(input.slice(1), final);
  }

  getAllPaths(): number[][] {
    if (!this.children) {
      return [];
    }

    const results: number[][] = [];
    this.children.forEach((v, k) => {
      const subPaths = v.getAllPaths();
      if (!subPaths.length) {
        results.push([k]);
      } else {
        subPaths.forEach(arr => arr.push(k));
        results.push(...subPaths);
      }
    });

    return results;
  }

  findFinal(path: number[]): number | undefined {
    if (!path.length) {
      return this.final;
      // throw new Error("zero length path");
    }
    if (path.length === 1) {
      return this.children?.get(path[0])?.final;
    }

    return this.children?.get(path[0])?.findFinal(path.slice(1));
  }
}
