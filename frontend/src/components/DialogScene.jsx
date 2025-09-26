import React, { useEffect, useMemo, useState } from "react";
import "../styles/dialogScene.css";

const LINES = [
  {
    id: "S1",
    name: "직원 1",
    side: "right",
    avatar: "/agent.png",
    text: "자네가 Cat Joe지? 밤마다 도서관 폐지 더미에서 우주 사진 주워 모으던 그 집요함, 우리가 다 지켜봤네."
  },
  {
    id: "S2",
    name: "직원 2",
    side: "right",
    avatar: "/agent.png",
    text: "우린 Hidden Stars Program이야. NASA는 배경 대신 가능성을 본다. 자네의 모든 걸 훈련으로 빛나게 할 기회지 지구도, 자네 미래도 바뀔 거야."
  },
  {
    id: "CJ",
    name: "Cat Joe",
    side: "left",
    avatar: "/homeless.png",
    text: "별은… 늘 남 얘기인 줄 알았는데요."
  },
  {
    id: "S1",
    name: "직원 1",
    side: "right",
    avatar: "/agent.png",
    text: "선택은 자네 몫이야. 우리와 가장 깊은 물속에서 버티고, 가장 높은 곳에서 지구를 내려다볼 텐가?"
  },
  {
    id: "CJ",
    name: "Cat Joe",
    side: "left",
    avatar: "/homeless.png",
    text: "할게요. 숨만 쉬던 삶에서, 진짜로 살아보겠습니다."
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
