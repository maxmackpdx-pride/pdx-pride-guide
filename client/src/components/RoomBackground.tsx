import { createElement, useEffect } from "react";
import "./RoomBackground.css";

export default function RoomBackground({ room }: { room: "placez" | "eventz" | "scenez" | "outzide" }) {
  useEffect(() => {
    if (document.querySelector('script[data-room-shaders]')) return;
    const script = document.createElement("script");
    script.type = "module";
    script.src = "/room-shaders/room-background.js";
    script.dataset.roomShaders = "true";
    document.head.appendChild(script);
    script.addEventListener("error", () => script.remove(), { once: true });
  }, []);
  return createElement("zay-room-background", {
    room,
    className: "room-shader-background",
    "aria-hidden": true,
    style: { backgroundImage: `url("/room-shaders/textures/${room}.jpg")` },
  });
}
