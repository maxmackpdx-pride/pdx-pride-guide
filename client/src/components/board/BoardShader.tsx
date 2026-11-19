import { WebGLShader } from "@/components/ui/web-gl-shader";
import "./BoardShader.css";

type BoardShaderRoom = "gigz" | "giftz" | "sellz" | "mizzed" | "hauz" | "zlists";

/** NEEDZ' viewport shader and veil, with one room-color beam palette. */
export default function BoardShader({ room }: { room: BoardShaderRoom }) {
  const direction: -1 | 1 = room === "gigz" || room === "sellz" || room === "hauz" ? -1 : 1;
  return <>
    <WebGLShader accent={`var(--room-${room})`} palette="prime" direction={direction} waveSpeed={0.7} />
    <span className="board-shader-veil" aria-hidden="true" />
  </>;
}
