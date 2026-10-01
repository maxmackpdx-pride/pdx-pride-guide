import { WebGLShader } from "@/components/ui/web-gl-shader";
import "./BoardShader.css";

type BoardShaderRoom = "eventz" | "gigz" | "giftz" | "sellz" | "mizzed" | "hauz" | "zlists";

/** ReZources' viewport shader and veil, with one room-color beam palette. */
export default function BoardShader({ room }: { room: BoardShaderRoom }) {
  const direction: -1 | 1 = room === "gigz" || room === "sellz" || room === "hauz" ? -1 : 1;
  return <>
    <WebGLShader accent={room === "eventz" ? undefined : `var(--room-${room})`} palette={room === "eventz" ? "week" : "prime"} direction={direction} />
    <span className="board-shader-veil" aria-hidden="true" />
  </>;
}
