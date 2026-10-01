export default function BoardCloseSeam({
  line,
  url,
}: {
  line: string;
  url: string;
}) {
  return (
    <>
      <footer className="board-close">
        <div className="board-close__inner">
          <span className="board-close__line">{line}</span>
          <span className="board-close__url">{url}</span>
        </div>
      </footer>
    </>
  );
}
