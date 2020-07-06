import React, { useRef } from "react";

export default function RefWorkout() {
  const cb = useRef<HTMLInputElement>(null);
  const count = useRef({ value: 0 });
  const h1 = useRef<HTMLHeadingElement>(null);

  // const toggleChecked = () => {
  //   cb.current.checked = !cb.current.checked;
  // };
  //
  // const addInBed = () => {
  //   cb.current.value = `${cb.current.value}, in bed.`;
  // };

  const focusInput = () => {
    count.current.value++;
    console.log(count.current.value);
    h1.current.innerText = count.current.value.toString();
    cb.current.focus();
  };

  return (
    <>
      <input type="input" ref={cb} />
      <button onClick={focusInput}>BUTTON</button>
      <h1 ref={h1} />
    </>
  );
}
