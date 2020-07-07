import React, { ReactElement } from "react";

interface HandProps {
  active: boolean;
  text: string;
}

export default function Hand({ active, text }: HandProps): ReactElement {
  return (
    <div>
      <span style={active ? { border: "1px solid green" } : {}}>{text}</span>
    </div>
  );
}
