import React, { useEffect, useMemo, useState } from "react";
import "../styles/dialogScene.css";

const LINES = [
  {
    id: "S1",
    name: "Agent 1",
    side: "right",
    avatar: "/agent.png",
    text: "So, you’re Cat Joe, aren’t you? We’ve seen that spark in you — the one that drove you to collect space photos from old library scraps every night."
  },
  {
    id: "S2",
    name: "Agent 2",
    side: "right",
    avatar: "/agent.png",
    text: "We’re from the Hidden Stars Program. NASA sees potential in you. Everything you are could shape the next generation of astronauts. This is your chance — to change space, Earth, and your own future."
  },
  {
    id: "CJ",
    name: "Cat Joe",
    side: "left",
    avatar: "/homeless.png",
    text: "Stars... I never thought they had anything to do with me."
  },
  {
    id: "S1",
    name: "Agent 1",
    side: "right",
    avatar: "/agent.png",
    text: "The choice is yours. Will you train with us — in the deepest waters, and see Earth from the highest skies?"
  },
  {
    id: "CJ",
    name: "Cat Joe",
    side: "left",
    avatar: "/homeless.png",
    text: "Yes, sir. I’ll do it. It’s time to start my second life."
  }
];


export default function DialogScene({ onEnd }) {
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(false);
  const [typing, setTyping] = useState(true);
  const [charCount, setCharCount] = useState(0);

  const line = LINES[idx];
  const visibleText = useMemo(() => line.text.slice(0, charCount), [line, charCount]);

  useEffect(() => { setShown(true); }, []);

  useEffect(() => {
    setTyping(true);
    setCharCount(0);
  }, [idx]);

  useEffect(() => {
    if (!typing) return;
    const speed = 22;
    const timer = setInterval(() => {
      setCharCount((c) => {
        if (c >= line.text.length) {
          clearInterval(timer);
          setTyping(false);
          return c;
        }
        return c + 1;
      });
    }, speed);
    return () => clearInterval(timer);
  }, [typing, line.text]);

  const handleNext = () => {
    if (typing) {
      setTyping(false);
      setCharCount(line.text.length);
      return;
    }
    if (idx < LINES.length - 1) {
      setIdx(idx + 1);
    } else {
      onEnd && onEnd();
    }
  };

  return (
    <div className="dialog-scene">
      <div className="dialog-bg" />
      <div className={`dialog-avatars ${shown ? "in" : ""}`}>
        <img
          src={line.side === "left" ? line.avatar : "/transparent.png"}
          alt=""
          className={`avatar avatar-left ${line.side === "left" ? "active" : ""}`}
          draggable="false"
        />
        <img
          src={line.side === "right" ? line.avatar : "/transparent.png"}
          alt=""
          className={`avatar avatar-right ${line.side === "right" ? "active" : ""}`}
          draggable="false"
        />
      </div>

      <div className={`dialog-box ${shown ? "show" : ""}`}>
        <div className="dialog-name">{line.name}</div>
        <div className="dialog-text">
          {visibleText}
          <span className={`cursor ${typing ? "blink" : "hide"}`}>▌</span>
        </div>
        <button className="dialog-next" onClick={handleNext}>
          {typing ? "SKIP" : idx === LINES.length - 1 ? "END" : "NEXT"}
        </button>
      </div>
    </div>
  );
}
