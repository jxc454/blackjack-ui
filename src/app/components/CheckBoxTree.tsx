import React, { FunctionComponent, ReactNode } from "react";

interface CheckBoxTreeProps {
  label: string;
  checked: boolean;
  expanded: boolean;
  onCheck: () => void;
  onExpand: () => void;
  children: ReactNode;
}

const CheckBoxTree: FunctionComponent<CheckBoxTreeProps> = ({
  label,
  checked,
  expanded,
  onCheck,
  onExpand,
  children
}: CheckBoxTreeProps) => {
  return (
    <div key={label} style={{ marginLeft: 10 }}>
      <span onClick={onExpand} style={{ cursor: "default" }}>
        {expanded ? "\u2B07" : "\u27A1"}
      </span>
      <input type="checkbox" onChange={onCheck} checked={checked} id={label} />
      <label htmlFor={label}>{label}</label>
      {expanded && Boolean(children) && children}
    </div>
  );
};

export default CheckBoxTree;
