import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { shareCardUrl } from "@shared/shareCards";
import "./Darkroom.css";

const ZAYLIST_ART = "/brand/family/zaylist-primary.svg";
const DARKROOM_ART = "/brand/family/zaydark.svg";
const DARKROOM_PROFILE_ART = "/brand/waypoints/zaydark-profile-eggplant.png";
const DARKROOM_HEAT_MOTIF = "/brand/waypoints/zaydark-heat-motif.jpg";
const DARKROOM_TONGUE_MOTIF = "/brand/waypoints/zaydark-tongue-motif.jpg";
const ROUTE_PARALLAX_ART = "/brand/waypoints/roadmap-route-parallax.png";
const Z_BLUEPRINT_MOTIF = "/brand/waypoints/zaylist-blueprint-motif.png";

type WaypointMotif = "house-blueprint" | "afterz" | "secret-map" | "group-chat" | "travel" | "zaydark-profiles";

type Waypoint = {
  number: string;
  status: string;
  title: string;
  eyebrow: string;
  body: string;
  detail: string;
  tone: "red" | "cyan" | "magenta" | "acid" | "violet" | "orange";
  href?: string;
  hrefLabel?: string;
  motif?: WaypointMotif;
  art?: {
    src: string;
    alt: string;
  };
};

const WAYPOINTS: Waypoint[] = [
  {
    number: "01",
    status: "Complete",
    title: "THE HAÜZ",
    eyebrow: "Live now / Find your people",
    body: "Build a HAÜS with people you actually want to live with. Post a room, find a room, or start with the people first.",
    detail: "Compare timing, boundaries, access, pets, budgets, and the stuff that matters before anyone signs a lease.",
    tone: "cyan",
    motif: "house-blueprint",
    href: "/the-hauz",
    hrefLabel: "Build your HAÜS",
    art: {
      src: "/brand/family/the-hauz.svg",
      alt: "THE HAÜZ",
    },
  },
  {
    number: "02",
    status: "Planned pilot",
    title: "Z/Space",
    eyebrow: "Your people, one place",
    body: "Give your group a home on Zaylist. Put events, updates, resources, and opportunities where everyone can find them.",
    detail: "Less hunting through five apps. One place your community already knows.",
    tone: "acid",
    motif: "group-chat",
    art: {
      src: "/brand/family/z-space.svg",
      alt: "Z/SPACE",
    },
  },
  {
    number: "03",
    status: "Just coming",
    title: "Darkroom",
    eyebrow: "Share your spicy side",
    body: "Want to share your spicy side? Find the room, catch the look, see who's going, and let ZAYDARK turn up the heat.",
    detail: "Post what you're into, meet the right crowd, and reveal more only when the chemistry feels right.",
    tone: "red",
    motif: "zaydark-profiles",
    art: {
      src: DARKROOM_ART,
      alt: "ZAYDARK",
    },
  },
  {
    number: "04",
    status: "Planned",
    title: "AfterZ",
    eyebrow: "The night keeps moving",
    body: "Party’s not over. Drop the next stop and let everyone around you know where the AfterZ is.",
    detail: "One quick signal. Share it with your people. It disappears when the night is done.",
    tone: "magenta",
    motif: "afterz",
    art: {
      src: "/brand/family/afterz.svg",
      alt: "AFTERZ",
    },
  },
  {
    number: "05",
    status: "Planned",
    title: "Zenegades",
    eyebrow: "Make the gathering",
    body: "Pick a spot. Invite your people. Make a casual plan without building a full event listing.",
    detail: "Set the time, capacity, and secret location. Keep everyone on the same map when plans move.",
    tone: "orange",
    motif: "secret-map",
    art: {
      src: "/brand/family/zenegades.svg",
      alt: "Zenegades",
    },
  },
  {
    number: "06",
    status: "Planned",
    title: "Travel",
    eyebrow: "Find your people outside",
    body: "Find someone for the trail, campground, road trip, or long weekend.",
    detail: "Match on dates, pace, transport, gear, access, and comfort before you head out.",
    tone: "acid",
    motif: "travel",
    art: {
      src: "/brand/family/travelz.svg",
      alt: "TRAVELZ",
    },
  },
];

type IdeaStatus = "idle" | "sending" | "sent" | "error";

function IdeaCard() {
  const reveal = useScrollReveal<HTMLLIElement>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [idea, setIdea] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<IdeaStatus>("idle");

  const submitIdea = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    try {
      const form = new FormData();
      form.append("kind", "message");
      form.append("name", name.trim());
      form.append("email", email.trim());
      form.append("message", `Dark Room product idea:\n\n${idea.trim()}`);
      form.append("pageUrl", window.location.href);
      form.append("company", company);
      const response = await fetch("/api/contact/message", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Idea submission failed");
      setIdea("");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <li ref={reveal.ref} className={`darkroom-waypoint darkroom-waypoint--idea darkroom-mobile-reveal${reveal.visible ? " darkroom-mobile-reveal--visible" : ""}`} data-number="07" data-tone="white">
      <div className="darkroom-waypoint__marker" aria-hidden="true"><span>07</span></div>
      <article className="darkroom-waypoint__card darkroom-waypoint__card--idea pdx-glass-card pdx-glass-rebind" aria-label="Submit an idea for Zaylist">
        <div className="darkroom-card-composition darkroom-card-composition--idea">
        <span className="darkroom-idea-radar" aria-hidden="true"><i /></span>
        <span className="darkroom-idea-radar darkroom-idea-radar--secondary" aria-hidden="true"><i /></span>
        <span className="darkroom-card-datum" aria-hidden="true" />
        <div className="darkroom-waypoint__meta">
          <span><i className="darkroom-waypoint__status-dot" aria-hidden="true" />Your turn</span>
        </div>
        <div className="darkroom-idea-intro">
          <div className="darkroom-idea-logo" aria-hidden="true">
            <img src="/brand/family/ideaz.svg" alt="" />
          </div>
        </div>
        <h3 className="darkroom-idea-title">What should Zaylist build next?</h3>
        {status === "sent" ? (
          <div className="darkroom-idea-card__sent" role="status">
            <strong>Idea received.</strong>
            <span>Thank you for helping shape what comes next.</span>
            <button type="button" onClick={() => setStatus("idle")}>Send another</button>
          </div>
        ) : (
          <form className="darkroom-idea-form" onSubmit={submitIdea}>
            <label>
              <span>Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} autoComplete="name" />
            </label>
            <label>
              <span>Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={200} type="email" autoComplete="email" />
            </label>
            <label className="darkroom-idea-form__idea">
              <span>Your idea</span>
              <textarea value={idea} onChange={(event) => setIdea(event.target.value)} required maxLength={4000} rows={3} placeholder="What would make Zaylist more useful, fun, or yours?" />
            </label>
            <label className="darkroom-idea-form__trap" aria-hidden="true">
              <span>Company</span>
              <input value={company} onChange={(event) => setCompany(event.target.value)} tabIndex={-1} autoComplete="off" />
            </label>
            <button type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending..." : "Submit idea"}</button>
            {status === "error" ? <p className="darkroom-idea-form__error" role="alert">That did not send. Please try once more.</p> : null}
          </form>
        )}
        </div>
      </article>
    </li>
  );
}

function WaypointItem({ waypoint }: { waypoint: Waypoint }) {
  const reveal = useScrollReveal<HTMLLIElement>();

  return (
    <li ref={reveal.ref} className={`darkroom-waypoint darkroom-mobile-reveal${reveal.visible ? " darkroom-mobile-reveal--visible" : ""}`} data-number={waypoint.number} data-tone={waypoint.tone}>
      <div className="darkroom-waypoint__marker" aria-hidden="true">
        <span>{waypoint.number}</span>
      </div>
      <article className="darkroom-waypoint__card pdx-glass-card pdx-glass-rebind" data-motif={waypoint.motif}>
        <div className="darkroom-card-composition">
        <span className="pdx-refract" aria-hidden="true" />
        <span className="darkroom-card-datum" aria-hidden="true" />
        {waypoint.motif === "zaydark-profiles" ? <PortlandCardMap /> : null}
        <div className="darkroom-waypoint__meta">
          <span><i className="darkroom-waypoint__status-dot" aria-hidden="true" />{waypoint.status}</span>
          <span>{waypoint.eyebrow}</span>
        </div>
        {waypoint.art ? (
          <h3 className="darkroom-waypoint__logo-heading">
            <img src={waypoint.art.src} alt={waypoint.art.alt} loading="eager" decoding="async" />
          </h3>
        ) : <h3>{waypoint.title}</h3>}
        {waypoint.motif ? <WaypointMotif motif={waypoint.motif} /> : null}
        <div className="darkroom-waypoint__copy">
          <p>{waypoint.body}</p>
          <div className="darkroom-waypoint__detail">{waypoint.detail}</div>
          {waypoint.href && waypoint.hrefLabel ? (
            <Link className="darkroom-waypoint__link" href={waypoint.href}>{waypoint.hrefLabel} <span aria-hidden="true">-&gt;</span></Link>
          ) : null}
        </div>
        </div>
      </article>
    </li>
  );
}

function WaypointMotif({ motif }: { motif: WaypointMotif }) {
  if (motif === "house-blueprint") {
    return (
      <div className="darkroom-card-motif darkroom-card-motif--house-blueprint" aria-hidden="true">
        <svg className="darkroom-house-blueprint" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid slice" focusable="false">
          <g className="darkroom-house-blueprint__grid">
            <path d="M0 52H1000M0 104H1000M0 156H1000M0 208H1000M0 260H1000M0 312H1000M0 364H1000M0 416H1000M0 468H1000" />
            <path d="M50 0V520M100 0V520M150 0V520M200 0V520M250 0V520M300 0V520M350 0V520M400 0V520M450 0V520M500 0V520M550 0V520M600 0V520M650 0V520M700 0V520M750 0V520M800 0V520M850 0V520M900 0V520M950 0V520" />
          </g>
          <g className="darkroom-house-blueprint__plan">
            <path d="M98 78H890V444H98Z" />
            <path d="M98 252H350V78M350 252H594V78M594 252H890M350 252V444M690 252V444" />
            <path d="M182 78V132M422 78V132M764 78V132M98 330H152M350 350H404M690 330H744" />
            <path d="M182 132A54 54 0 0 1 236 78M422 132A54 54 0 0 1 476 78M764 132A54 54 0 0 1 818 78M152 330A54 54 0 0 0 98 384M404 350A54 54 0 0 0 350 404M744 330A54 54 0 0 0 690 384" />
            <path d="M140 198H304M392 188H548M634 136H844M412 396H622M740 396H846" />
          </g>
          <g className="darkroom-house-blueprint__measure">
            <path d="M98 48H890M68 78V444" />
            <path d="M98 39V57M350 39V57M594 39V57M890 39V57M59 78H77M59 252H77M59 444H77" />
          </g>
          <g className="darkroom-house-blueprint__people">
            <circle cx="280" cy="324" r="17" /><circle cx="280" cy="324" r="5" />
            <circle cx="540" cy="342" r="17" /><circle cx="540" cy="342" r="5" />
            <circle cx="812" cy="300" r="17" /><circle cx="812" cy="300" r="5" />
          </g>
        </svg>
        <span className="darkroom-motif-line-icon darkroom-motif-line-icon--home" />
        <span className="darkroom-house-blueprint__note">Roommate?</span>
      </div>
    );
  }

  if (motif === "afterz") {
    return (
      <div className="darkroom-card-motif darkroom-card-motif--afterz-map" aria-hidden="true">
        <svg className="darkroom-afterz-map" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid slice" focusable="false">
          <g className="darkroom-afterz-map__streets">
            <path d="M-40 110C144 54 252 138 402 92S706 54 1048 142" />
            <path d="M-28 384C148 330 262 414 420 358S734 318 1030 402" />
            <path d="M144 -30C120 110 178 218 134 550M432 -20C406 126 470 238 418 546M756 -24C716 112 786 254 732 552" />
          </g>
          <path className="darkroom-afterz-map__route-glow" d="M24 408C146 354 168 244 302 274S466 416 588 316S716 136 918 126" />
          <path className="darkroom-afterz-map__route" d="M24 408C146 354 168 244 302 274S466 416 588 316S716 136 918 126" />
          <g className="darkroom-afterz-map__house" transform="translate(790 58)">
            <path d="M0 94L114 4L228 94V250H0Z" />
            <path d="M76 250V154H152V250M34 120H78V164H34ZM162 120H206V164H162Z" />
          </g>
          <g className="darkroom-afterz-map__party" transform="translate(904 102)">
            <circle r="7" /><circle cx="-42" cy="32" r="5" /><circle cx="45" cy="38" r="5" />
            <path d="M0 -42V-19M-39 -24L-22 -8M39 -24L22 -8M-58 8L-34 12M58 8L34 12" />
          </g>
        </svg>
        <div className="darkroom-afterz-invite">
          <span className="darkroom-afterz-invite__app">
            <img src="/brand/family/prime-z.svg" alt="" loading="eager" decoding="async" />
          </span>
          <div className="darkroom-afterz-invite__body">
          <div className="darkroom-afterz-invite__head">
            <strong>AfterZ</strong>
            <span className="darkroom-afterz-invite__time">now</span>
          </div>
          <strong className="darkroom-afterz-invite__title">You're invited</strong>
          <span className="darkroom-afterz-invite__copy">Plans moved. Tap for the next stop.</span>
          </div>
        </div>
      </div>
    );
  }

  if (motif === "secret-map") {
    return (
      <div className="darkroom-card-motif darkroom-card-motif--secret-map" aria-hidden="true">
        <svg className="darkroom-secret-map" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid slice" focusable="false">
          <g className="darkroom-secret-map__contours">
            <path d="M-90 476C84 366 126 482 292 390S515 256 685 298S860 228 1068 104" />
            <path d="M-118 414C40 330 122 408 266 336S500 202 664 242S845 168 1052 62" />
            <path d="M-70 532C92 438 188 548 344 450S596 334 746 360S906 304 1084 194" />
            <path d="M82 590C196 510 306 574 426 496S634 398 792 418S930 370 1088 286" />
          </g>
          <path className="darkroom-secret-map__route-glow" d="M-70 445C40 392 36 284 166 305C286 324 246 426 392 389C524 356 473 226 621 245C752 263 742 154 935 98" />
          <path className="darkroom-secret-map__route" d="M-70 445C40 392 36 284 166 305C286 324 246 426 392 389C524 356 473 226 621 245C752 263 742 154 935 98" />
          <g className="darkroom-secret-map__stops">
            <circle cx="166" cy="305" r="5" />
            <circle cx="392" cy="389" r="5" />
            <circle cx="621" cy="245" r="5" />
          </g>
          <g className="darkroom-secret-map__pin" transform="translate(935 98)">
            <circle r="24" />
            <circle r="7" />
          </g>
          <g className="darkroom-secret-map__dj" transform="translate(704 302)">
            <rect x="0" y="0" width="244" height="132" rx="14" />
            <circle cx="61" cy="66" r="39" />
            <circle cx="61" cy="66" r="8" />
            <circle cx="183" cy="66" r="39" />
            <circle cx="183" cy="66" r="8" />
            <path d="M112 22H132M112 42H132M112 62H132M112 82H132M112 102H132" />
            <path d="M18 117H44M200 117H226M104 117H140" />
          </g>
          <g className="darkroom-secret-map__eq" transform="translate(84 112)">
            <path d="M0 58V30M18 58V12M36 58V38M54 58V2M72 58V24M90 58V16M108 58V42" />
          </g>
          <text className="darkroom-secret-map__label" x="716" y="148">Secret location</text>
        </svg>
        <span className="darkroom-motif-line-icon darkroom-motif-line-icon--navigate" />
      </div>
    );
  }

  if (motif === "travel") {
    return (
      <div className="darkroom-card-motif darkroom-card-motif--travel" aria-hidden="true">
        <svg className="darkroom-travel-topography" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid slice" focusable="false">
          <g className="darkroom-travel-topography__mountains">
            <path d="M-30 432L176 214L298 342L482 116L646 304L782 186L1034 436" />
            <path d="M-22 466L176 248L298 376L482 150L646 338L782 220L1026 470" />
            <path d="M-14 500L176 282L298 410L482 184L646 372L782 254L1018 504" />
            <path d="M176 214L214 298L258 272L298 342M482 116L526 222L574 198L646 304M782 186L824 278L870 246" />
          </g>
          <g className="darkroom-travel-topography__contours">
            <path d="M-40 94C116 16 246 160 390 78S684 6 1044 104" />
            <path d="M-54 142C106 64 248 204 402 126S702 52 1050 154" />
            <path d="M-48 194C124 112 276 256 426 176S728 102 1050 208" />
          </g>
          <g className="darkroom-travel-topography__tent" transform="translate(716 292)">
            <path d="M0 116L92 0L188 116ZM92 0L126 116M-26 116H214" />
            <path d="M90 0V-36M90-36L128-22L90-10" />
          </g>
        </svg>
        <svg className="darkroom-travel-paw" viewBox="0 0 120 120" focusable="false">
          <ellipse cx="60" cy="78" rx="31" ry="27" />
          <ellipse cx="27" cy="46" rx="12" ry="17" transform="rotate(-24 27 46)" />
          <ellipse cx="48" cy="27" rx="12" ry="17" transform="rotate(-7 48 27)" />
          <ellipse cx="73" cy="27" rx="12" ry="17" transform="rotate(7 73 27)" />
          <ellipse cx="94" cy="46" rx="12" ry="17" transform="rotate(24 94 46)" />
        </svg>
        <div className="darkroom-travel-post">
          <span className="darkroom-travel-post__avatar">
            <svg viewBox="0 0 120 120" focusable="false">
              <ellipse cx="60" cy="78" rx="31" ry="27" />
              <ellipse cx="27" cy="46" rx="12" ry="17" transform="rotate(-24 27 46)" />
              <ellipse cx="48" cy="27" rx="12" ry="17" transform="rotate(-7 48 27)" />
              <ellipse cx="73" cy="27" rx="12" ry="17" transform="rotate(7 73 27)" />
              <ellipse cx="94" cy="46" rx="12" ry="17" transform="rotate(24 94 46)" />
            </svg>
          </span>
          <div className="darkroom-travel-post__body">
            <div className="darkroom-travel-post__byline">
              <strong>Zaylist Travel</strong>
              <span>@travelz · now</span>
            </div>
            <strong className="darkroom-travel-post__title">Looking for a tent buddy?</strong>
            <span className="darkroom-travel-post__meta">Portland · 12 replies</span>
          </div>
        </div>
      </div>
    );
  }

  if (motif === "group-chat") {
    return (
      <div className="darkroom-card-motif darkroom-card-motif--group-chat" aria-hidden="true">
        <svg className="darkroom-group-chat" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid slice" focusable="false">
          <path className="darkroom-group-chat__link" d="M80 142C204 56 318 212 444 135S686 54 918 168" />
          <g className="darkroom-group-chat__bubbles">
            <path d="M530 52H894Q938 52 938 96V220Q938 264 894 264H746L682 316L696 264H530Q486 264 486 220V96Q486 52 530 52Z" />
            <path d="M78 222H376Q416 222 416 262V382Q416 422 376 422H244L188 468L202 422H78Q38 422 38 382V262Q38 222 78 222Z" />
            <path d="M594 332H856Q890 332 890 366V438Q890 472 856 472H754L708 506L718 472H594Q560 472 560 438V366Q560 332 594 332Z" />
          </g>
          <g className="darkroom-group-chat__message-lines">
            <path d="M542 112H826M542 154H760M542 196H862" />
            <path d="M92 280H330M92 322H282M92 364H348" />
            <path d="M614 382H826M614 422H774" />
          </g>
          <g className="darkroom-group-chat__people">
            <g transform="translate(132 120)"><circle r="27" /><circle r="7" /></g>
            <g transform="translate(226 90)"><circle r="22" /><circle r="6" /></g>
            <g transform="translate(330 136)"><circle r="25" /><circle r="7" /></g>
            <g transform="translate(902 352)"><circle r="25" /><circle r="7" /></g>
          </g>
          <g className="darkroom-group-chat__typing" transform="translate(777 226)">
            <circle cx="0" cy="0" r="5" />
            <circle cx="22" cy="0" r="5" />
            <circle cx="44" cy="0" r="5" />
          </g>
        </svg>
        <div className="darkroom-group-board-post">
          <span className="darkroom-group-board-post__avatar-rail">
            <span className="darkroom-group-board-post__avatar">🐶</span>
          </span>
          <div className="darkroom-group-board-post__body">
            <span className="darkroom-group-board-post__label"><span className="darkroom-motif-line-icon darkroom-motif-line-icon--boards" /> Z/SPACE · Question</span>
            <strong>Where can I buy my first hood?</strong>
            <small>Bark!</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="darkroom-card-motif darkroom-card-motif--zaydark-symbols" aria-hidden="true">
        <img src={DARKROOM_HEAT_MOTIF} alt="" loading="eager" decoding="async" />
        <img src={DARKROOM_TONGUE_MOTIF} alt="" loading="eager" decoding="async" />
      </div>
      <div className="darkroom-card-motif darkroom-card-motif--profiles" aria-hidden="true">
        <div className="darkroom-profile-stack">
          {(["eggplant", "pup", "eggplant", "cat", "eggplant", "pup", "cat"] as const).map((symbol, index) => (
            <span className={`darkroom-profile${symbol === "eggplant" ? "" : " darkroom-profile--line"}`} key={`${symbol}-${index}`}>
              {symbol === "eggplant" ? <img src={DARKROOM_PROFILE_ART} alt="" loading="eager" decoding="async" /> : symbol === "pup" ? (
                <svg viewBox="0 0 48 48" focusable="false"><path d="M14 18L8 10Q7 23 12 29C13 39 35 39 36 29Q41 22 40 10L33 18Q24 13 14 18ZM17 27Q24 33 31 27M20 23H20.1M28 23H28.1M24 27V29" /></svg>
              ) : (
                <svg viewBox="0 0 48 48" focusable="false"><path d="M13 19L11 9L20 15Q24 13 28 15L37 9L35 20Q40 35 24 38Q8 35 13 19ZM18 25H18.1M30 25H30.1M21 30Q24 33 27 30M24 27V30M14 29L6 27M14 32L6 34M34 29L42 27M34 32L42 34" /></svg>
              )}
            </span>
          ))}
        </div>
        <span className="darkroom-profile-stack__label"><span className="darkroom-motif-line-icon darkroom-motif-line-icon--profile" /> Private profiles</span>
      </div>
    </>
  );
}

function PortlandCardMap() {
  return (
    <svg className="darkroom-portland-map" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <g className="darkroom-portland-map__streets">
        <path d="M52 70H472M26 124H492M16 178H506M42 232H520M12 286H532M34 340H542M4 394H554M38 448H570" />
        <path d="M78 28V482M142 18V496M206 38V504M270 16V488M334 26V500M398 12V490M462 32V508" />
        <path d="M650 48H988M626 102H1008M640 156H982M610 210H1002M632 264H990M606 318H1010M624 372H984M602 426H1006M642 480H976" />
        <path d="M674 18V502M738 34V488M802 12V510M866 24V496M930 8V512" />
        <path d="M38 454L470 42M116 500L518 114M616 478L960 134M694 512L1002 204" />
      </g>
      <path className="darkroom-portland-map__river" d="M548 -28C506 48 574 103 536 173C500 238 577 290 544 362C520 414 549 466 520 548" />
      <g className="darkroom-portland-map__bridges">
        <path d="M456 116L642 100M468 206L626 214M474 292L636 304M480 382L614 398" />
      </g>
      <g className="darkroom-portland-map__labels">
        <text x="74" y="105">NW</text>
        <text x="324" y="268">OLD TOWN</text>
        <text x="700" y="188">NE</text>
        <text x="744" y="414">SE</text>
      </g>
      <g className="darkroom-portland-map__pin" transform="translate(486 246)">
        <circle r="19" />
        <circle r="5" />
      </g>
    </svg>
  );
}

export default function Darkroom() {
  usePageSeo(
    "Next | What Zaylist Is Building",
    "See what is next on Zaylist: THE HAÜZ, AfterZ, Zenegades, Z/SPACE, Travel, and ZAYDARK.",
    {
      image: shareCardUrl("next"),
      imageAlt: "Here’s what’s next on Zaylist — a blueprint roadmap of upcoming products",
    },
  );

  return (
    <div className="darkroom-page">
      <div
        className="darkroom-route-parallax"
        aria-hidden="true"
        style={{ backgroundImage: `url(${ROUTE_PARALLAX_ART})` }}
      />
      <div className="darkroom-z-blueprint-scatter" aria-hidden="true">
        {["one", "two", "three", "four"].map((placement) => (
          <img
            key={placement}
            className={`darkroom-z-blueprint-motif darkroom-z-blueprint-motif--${placement}`}
            src={Z_BLUEPRINT_MOTIF}
            alt=""
            decoding="async"
          />
        ))}
        {[
          { placement: "five", src: "/brand/waypoints/portland-sign-wallpaper.png" },
          { placement: "six", src: "/brand/waypoints/z-blueprint-wallpaper.png" },
          { placement: "seven", src: "/brand/waypoints/portland-sign-wallpaper.png" },
          { placement: "eight", src: "/brand/waypoints/z-blueprint-wallpaper.png" },
        ].map(({ placement, src }) => (
          <img
            key={placement}
            className={`darkroom-wallpaper-motif darkroom-wallpaper-motif--${placement}`}
            src={src}
            alt=""
            decoding="async"
          />
        ))}
      </div>
      <div className="darkroom-construction-layer" aria-hidden="true">
        <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" focusable="false">
          <g className="darkroom-construction-layer__axes">
            <path d="M74 136H584M74 126V146M584 126V146" />
            <path d="M1042 158H1516M1042 148V168M1516 148V168" />
            <path d="M136 78V842M126 78H146M126 842H146" />
            <path d="M1462 88V874M1452 88H1472M1452 874H1472" />
          </g>
          <g className="darkroom-construction-layer__geometry">
            <circle cx="346" cy="346" r="166" />
            <circle cx="346" cy="346" r="92" />
            <path d="M180 346H512M346 180V512M226 226L466 466M466 226L226 466" />
            <circle cx="1248" cy="612" r="214" />
            <circle cx="1248" cy="612" r="118" />
            <path d="M1034 612H1462M1248 398V826M1097 461L1399 763" />
            <path d="M676 126L822 272L968 126M676 874L822 728L968 874" />
          </g>
          <g className="darkroom-construction-layer__leaders">
            <path d="M448 216L592 98H730" />
            <path d="M1118 488L1002 340H888" />
            <path d="M1328 748L1402 866H1520" />
            <circle cx="448" cy="216" r="7" />
            <circle cx="1118" cy="488" r="7" />
            <circle cx="1328" cy="748" r="7" />
          </g>
          <g className="darkroom-construction-layer__labels">
            <text x="92" y="118">AXIS / ROUTE 06</text>
            <text x="488" y="88">R 166</text>
            <text x="1048" y="140">SECTION B-B</text>
            <text x="856" y="330">120° / LOCK</text>
            <text x="1388" y="892">GRID 48</text>
          </g>
        </svg>
      </div>
      <section className="darkroom-hero" aria-labelledby="darkroom-plans-title">
        <div className="darkroom-topography" aria-hidden="true" />
        <img
          className="darkroom-hero__schematic"
          src="/brand/waypoints/roadmap-hero-schematic.png"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
        />
        <img
          className="darkroom-hero__portland-sign"
          src="/brand/waypoints/roadmap-hero-portland-sign.png"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
        />
        <div className="darkroom-hero__inner">
          <div className="darkroom-hero__copy">
            <p className="darkroom-kicker"><span aria-hidden="true" /> Zaylist / Up next</p>
            <h1 id="darkroom-plans-title" className="darkroom-hero__title">
              <span>Here's what's</span> <em>next.</em>
              <span className="darkroom-hero__title-blueprint" aria-hidden="true">
                <svg viewBox="0 0 300 150" focusable="false">
                  <g className="darkroom-hero__title-blueprint-lines">
                    <path d="M12 38H274M12 29V47M274 29V47" />
                    <path d="M40 78H258M40 68V88M258 68V88" />
                    <path d="M72 122L126 84L184 122" />
                    <path d="M126 84V120M184 122H254" />
                    <circle cx="126" cy="84" r="6" />
                    <circle cx="184" cy="122" r="6" />
                  </g>
                  <g className="darkroom-hero__title-blueprint-guides">
                    <path d="M26 16V136M286 14V136" />
                    <path d="M22 20H30M22 132H30M282 20H290M282 132H290" />
                  </g>
                  <g className="darkroom-hero__title-blueprint-labels">
                    <text x="96" y="27">ROUTE / 06</text>
                    <text x="196" y="112">R 24</text>
                    <text x="84" y="145">120°</text>
                  </g>
                </svg>
              </span>
            </h1>
            <p className="darkroom-hero__lede">
              Six big things. Build a HAÜS. Keep the night moving. Make a gathering. Give your community a home. Find your people on the road. Keep your private side private.
            </p>
          </div>
        </div>
      </section>

      <section id="waypoints" className="darkroom-waypoints" aria-label="Zaylist product plans">
        <ol className="darkroom-route">
          {WAYPOINTS.map((waypoint) => <WaypointItem waypoint={waypoint} key={waypoint.number} />)}
          <IdeaCard />
        </ol>
      </section>

    </div>
  );
}
