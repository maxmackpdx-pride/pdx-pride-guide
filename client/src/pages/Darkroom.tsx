import { usePageSeo } from "@/hooks/usePageSeo";
import "./Darkroom.css";

const SRC = "/brand/darkroom.jpg";

/**
 * Full-screen Darkroom image with RGB glitch (same recipe as site wordmark glitch).
 * Calm mode / reduced motion: static image only.
 */
export default function Darkroom() {
  usePageSeo("Darkroom | Zaylist", "Darkroom — full-screen glitch still.", {
    image: SRC,
    imageAlt: "Darkroom",
  });

  return (
    <main className="darkroom" aria-label="Darkroom">
      <h1 className="darkroom__sr">Darkroom</h1>
      <div className="darkroom__stage">
        <img className="darkroom__img darkroom__img--base" src={SRC} alt="" />
        <img
          className="darkroom__img darkroom__img--ghost darkroom__img--a"
          src={SRC}
          alt=""
          aria-hidden="true"
        />
        <img
          className="darkroom__img darkroom__img--ghost darkroom__img--b"
          src={SRC}
          alt=""
          aria-hidden="true"
        />
      </div>
    </main>
  );
}
