import { DataItem } from "./CheckBoxData";
import { pullAt, range, remove } from "lodash";
import * as faker from "faker";

function setChildren(node: DataItem, children: DataItem[], x = 0): boolean {
  console.dir(node);
  console.log(children);

  if (!children.length) return true;

  if (x > 5) return true;

  if (!node.children.length) {
    node.children = children;
    return true;
  } else {
    node.children.forEach(child => {
      const set = setChildren(child, children, x + 1);
      if (set) return true
    })
    return false
  }
}

export function fakeData(n: number): DataItem[] {
  const nodes = range(0, n).map(i => ({
    label: `${faker.random.words(1)}${i}`,
    checked: faker.random.boolean(),
    children: [],
    expanded: true
  }));

  while (nodes.length > 5) {
    const count = faker.random.number(7);
    const children = remove(nodes, (_, i) => i < count);

    if (nodes.length) {
      const parent = pullAt(nodes, [0])[0] || { children: undefined };
      parent.children = children;
      nodes.push(parent);
    } else {
      return children;
    }
  }

  return nodes;
}
