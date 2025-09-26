import React from "react";

export default function Splash({ onStart }) {
  return (
    <div className="screen screen--splash">
      <div className="splash-inner">
        <h1 className="title">NASA 25th Anniversary</h1>

        <button
          className="pixel-btn"
          onClick={onStart}
          aria-label="Start"
        >
          START
        </button>

        <p className="hint">Press START to continue</p>
      </div>
    </div>
  );
}
