import React, { useEffect, useState } from "react";

export default function AlleyScene({ startColored = false, onNext }) {
  const [showPaper, setShowPaper] = useState(false);
  const [colored, setColored] = useState(startColored);

  useEffect(() => {
    const t1 = setTimeout(() => setShowPaper(true), 600);
    const t2 = !startColored ? setTimeout(() => setColored(true), 2800) : null;
    return () => {
      clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, [startColored]);

  return (
    <div className="screen screen--alley">
      <div className={`alley-bg ${colored ? "colored" : "gray"}`} />
      {showPaper && (
        <img
          className="paper-fly"
          src="/newspaper.png"
          alt="newspaper"
          draggable="false"
        />
      )}
      <button className="next-btn" onClick={onNext}>NEXT</button>
    </div>
  );
}
