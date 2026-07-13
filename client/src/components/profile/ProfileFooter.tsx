/** Close seam: rainbow hairline + profile URL. */
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
        <a className="pp-close__url" href={`/u/${encodeURIComponent(handle)}`}>
          {url}
        </a>
      </div>
    </footer>
  );
}
