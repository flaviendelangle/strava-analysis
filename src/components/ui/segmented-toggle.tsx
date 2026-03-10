import * as React from "react";

interface SegmentedToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}

export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
}: SegmentedToggleProps<T>) {
  return (
    <div className="bg-muted inline-flex rounded-md p-0.5 text-xs">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded px-2 py-0.5 transition-colors ${
            value === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
