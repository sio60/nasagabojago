import React, { useEffect, useState } from "react";
import "../styles/alleyCharacters.css";

export default function AlleyCharacters({ onNext }) {
  const [isIn, setIsIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsIn(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`alley-characters screen ${isIn ? "is-in" : ""}`}>
      <div className="alley-characters__bg" />
      <div className="alley-characters__row">
        <img src="/homeless.png" alt="homeless" className="alley-characters__img alley-characters__img--left" />
        <img src="/agent.png" alt="agent" className="alley-characters__img alley-characters__img--right" />
      </div>
      <button className="alley-characters__next" onClick={onNext}>NEXT</button>
    </div>
  );
}
AlleyCharacters.jsx