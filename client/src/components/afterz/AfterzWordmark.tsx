import { AFTERZ_WORDMARK } from "@/lib/homeWorlds";
import "./invitations.css";

export default function AfterzWordmark() {
  return <span className="afterz-wordmark">
    <img src={AFTERZ_WORDMARK} alt="Afterz" width={1000} height={500}/>
  </span>;
}
