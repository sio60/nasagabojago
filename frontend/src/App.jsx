import React, { useState } from "react";
import Splash from "./components/Splash.jsx";
import AlleyScene from "./components/AlleyScene.jsx";
import AlleyCharacters from "./components/AlleyCharacters.jsx";
import DialogScene from "./components/DialogScene.jsx";
import CupolaScene from "./components/CupolaScene.jsx"; 

export default function App() {
  const [scene, setScene] = useState("splash");

  return (
    <div className="app-root">
      {scene === "splash" && (
        <Splash
          onStart={() => setScene("alley")}
          onCupola={() => setScene("cupola")} 
        />
      )}
      {scene === "alley" && <AlleyScene onNext={() => setScene("alley-characters")} />}
      {scene === "alley-characters" && <AlleyCharacters onNext={() => setScene("dialog")} />}
      {scene === "dialog" && <DialogScene onEnd={() => setScene("cupola")} />}
      {scene === "cupola" && <CupolaScene />} 
    </div>
  );
}
