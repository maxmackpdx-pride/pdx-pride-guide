/**
 * Close seam: rainbow hairline + mantra + profile URL.
 * Matches Profile Reimagined 3a.
 */
type Props = {
  username: string;
};

export default function ProfileFooter({ username }: Props) {
  const handle = username.replace(/^@/, "");
  const url = `prideguidepdx.com/u/${handle}`;

  return (
    <footer className="pp-close">
      <div className="pp-close__seam" aria-hidden="true" />
      <div className="pp-close__row">
        <span className="pp-close__mantra">
          <span className="pp-close__mantra-short">Lockerroom rules · Be kind</span>
          <span className="pp-close__mantra-long">
            Lockerroom rules · Be kind · Show up for each other
          </span>
        </span>
        <a className="pp-close__url" href={`/u/${encodeURIComponent(handle)}`}>
          {url}
        </a>
      </div>
    </footer>
  );
}
