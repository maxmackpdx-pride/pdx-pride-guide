import "./NeedzHeartbeatBackdrop.css";

const textureRoot = "/room-shaders/textures/needz-heartbeat";

/** NeedZ-only artwork. Keep the illustration out of the accessibility tree. */
export function NeedzHeartbeatBackdrop() {
  return (
    <div className="needz-heartbeat-backdrop" aria-hidden="true">
      <div className="needz-heartbeat-backdrop__art">
        <img
          src={`${textureRoot}-1671.webp`}
          srcSet={`${textureRoot}-960.webp 960w, ${textureRoot}-1671.webp 1671w, ${textureRoot}-3840.webp 3840w`}
          sizes="(max-width: 620px) 620px, 100vw"
          width={1671}
          height={941}
          alt=""
          draggable={false}
        />
        <svg className="needz-heartbeat-backdrop__pulse" viewBox="0 0 1671 941" focusable="false">
          <path
            pathLength="1"
            d="M455 371 C540 371 577 372 612 371 S674 341 709 341 S755 370 782 371 S806 354 826 393 L869 237 L914 455 C930 405 941 372 971 371 S1019 372 1064 347 S1129 324 1163 333 S1244 370 1406 371"
          />
        </svg>
      </div>
    </div>
  );
}
