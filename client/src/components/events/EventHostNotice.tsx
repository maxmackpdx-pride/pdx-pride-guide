export function EventHostNotice({ className }: { className?: string }) {
  return (
    <p className={className}>
      Events are organized by their hosts. Zaylist is not responsible for independently hosted activities.{" "}
      <a href="/legal#event-terms">Read the event terms</a>.
    </p>
  );
}
