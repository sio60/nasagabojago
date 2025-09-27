import React, { useEffect, useRef, useState } from "react";
import "../styles/Splash.css";

function Type({ text, startDelay = 0, speed = 70, className, onDone }) {
  const [count, setCount] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    let intervalId;
    const startId = setTimeout(() => {
      intervalId = setInterval(() => {
        setCount((c) => {
          if (c >= text.length) {
            clearInterval(intervalId);
            if (!doneRef.current) {
              doneRef.current = true;
              onDone?.(); 
            }
            return c;
          }
          return c + 1;
        });
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(startId);
      clearInterval(intervalId);
    };
  }, [text, startDelay, speed, onDone]);

  return <span className={className}>{text.slice(0, count)}</span>;
}

export default function Splash({ onStart }) {
  const [finishedCount, setFinishedCount] = useState(0);
  const allDone = finishedCount >= 4;

  const handleDone = () => setFinishedCount((n) => n + 1);

  return (
    <div className="screen screen--splash">
      <img src="/logo.png" alt="logo" className="logo" />

      <button
        className={`pixel-btn pixel-btn--big ${allDone ? "is-visible" : ""}`}
        onClick={onStart}
        disabled={!allDone}
        aria-hidden={!allDone}
      >
        START
      </button>

      <div className="stair-text">
        <div>
          <span className="big">N</span>
          <Type className="type" text="ASA" startDelay={200} speed={40} onDone={handleDone} />
        </div>
        <div>
          <span className="big">A</span>
          <Type className="type" text="nniversary" startDelay={600} speed={40} onDone={handleDone} />
        </div>
        <div>
          <span className="big">S</span>
          <Type className="type" text="tories" startDelay={1000} speed={40} onDone={handleDone} />
        </div>
        <div>
          <span className="big">A</span>
          <Type className="type" text="pp" startDelay={1400} speed={40} onDone={handleDone} />
        </div>
      </div>
    </div>
  );
}
