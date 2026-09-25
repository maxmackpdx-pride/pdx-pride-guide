interface MultiStepProgressProps {
  steps: readonly string[];
  currentStep: number;
  onBack: (step: number) => void;
}

export function MultiStepProgress({ steps, currentStep, onBack }: MultiStepProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-1" aria-label={`Signup step ${currentStep + 1} of ${steps.length}: ${steps[currentStep]}`}>
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => index < currentStep && onBack(index)}
            disabled={index >= currentStep}
            aria-current={index === currentStep ? "step" : undefined}
            aria-label={`${label}, step ${index + 1} of ${steps.length}${index < currentStep ? ", go back" : ""}`}
            className="flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-110 disabled:cursor-default disabled:hover:scale-100"
          >
            <span className={`block h-2.5 w-2.5 rounded-full transition-all ${index === currentStep ? "scale-125 bg-[#c8fa3c] shadow-[0_0_12px_rgba(200,250,60,.6)]" : index < currentStep ? "bg-[#19e3ff]" : "bg-[#ff1fa0]/35"}`}>
            </span>
          </button>
        ))}
    </div>
  );
}
