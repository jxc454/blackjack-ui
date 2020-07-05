import React, { ReactElement, useState } from "react";
import CheckBoxTree from "./CheckBoxTree";
import { get, set } from "lodash";
import {fakeData} from "./helpers/checkbox_data";

export interface DataItem {
  label: string;
  checked: boolean;
  children: DataItem[];
  expanded: boolean;
}

export default function CheckBoxData(): ReactElement {
  const defaultDataItems: DataItem[] = fakeData(500);

  const [data, setData] = useState<DataItem[]>(defaultDataItems);

  const checkedDeep: (
    data: DataItem[],
    path: string,
    checked: boolean
  ) => void = (data: DataItem[], path: string, checked: boolean) => {
    set(data, `${path}.checked`, checked);
    const children: DataItem[] = get(data, `${path}.children`, []);

    children.forEach((_, index) =>
      checkedDeep(data, `${path}.children[${index}]`, checked)
    );
  };

  const dataToTree: (items: DataItem[], path: string) => ReactElement = (
    items: DataItem[],
    path: string
  ) => (
    <div>
      {items.map(({ checked, children, expanded, label }, index) => {
        const basePath = `${path ? path + "." : ""}[${index}]`;
        return (
          <CheckBoxTree
            key={`${path}.${label}`}
            label={label}
            checked={checked}
            expanded={expanded}
            onCheck={() => {
              const obj = [...data];
              checkedDeep(obj, basePath, !checked);
              setData(obj);
            }}
            onExpand={() => {
              const obj = [...data];
              set(obj, `${basePath}.expanded`, !expanded);
              setData(obj);
            }}
          >
            {children.length
              ? dataToTree(children, `${basePath}.children`)
              : null}
          </CheckBoxTree>
        );
      })}
    </div>
  );

  return dataToTree(data, "");
}
