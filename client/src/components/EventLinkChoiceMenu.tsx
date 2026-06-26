type Option = {
  label: string;
  hint?: string;
  onClick: () => void;
};

export default function EventLinkChoiceMenu({
  open,
  onClose,
  title,
  options,
  floating = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  options: Option[];
  floating?: boolean;
}) {
  if (!open) return null;

  return (
    <div className={`event-link-choice-menu${floating ? " event-link-choice-menu--floating" : ""}`} role="menu" aria-label={title}>
      <div className="event-link-choice-menu__title">{title}</div>
      {options.map(opt => (
        <button
          key={opt.label}
          type="button"
          role="menuitem"
          className="event-link-choice-menu__btn"
          onClick={() => {
            opt.onClick();
            onClose();
          }}
        >
          <span>{opt.label}</span>
          {opt.hint && <span className="event-link-choice-menu__hint">{opt.hint}</span>}
        </button>
      ))}
      <button type="button" className="event-link-choice-menu__cancel" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
}