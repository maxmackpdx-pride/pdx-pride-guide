type SpectrumDividerProps = {
  /** Reverse scroll direction for alternating bands */
  reverse?: boolean;
  className?: string;
};

export default function SpectrumDivider({ reverse = false, className = "" }: SpectrumDividerProps) {
  return (
    <div
      className={`spectrum-divider${reverse ? " spectrum-divider--reverse" : ""}${className ? ` ${className}` : ""}`.trim()}
      aria-hidden="true"
    >
      <div className="spectrum-divider__stripes" />
      <svg className="spectrum-divider__wave" viewBox="0 0 1200 32" preserveAspectRatio="none">
        <path
          d="M0,16 C150,32 300,0 450,16 C600,32 750,0 900,16 C1050,32 1200,0 1200,16 L1200,32 L0,32 Z"
          fill="#000"
        />
      </svg>
    </div>
  );
}