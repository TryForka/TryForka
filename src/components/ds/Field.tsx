import React, { useId } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import { cx } from './cx';
import { ICON_PROPS } from './icon';

// Form controls: 1px line border, basil focus ring, 10px radius.

const CONTROL = 'w-full rounded-control border border-line bg-surface text-ink outline-none transition-[border-color,box-shadow] duration-150 focus:border-basil focus:ring-2 focus:ring-basil/25 disabled:bg-canvas disabled:text-ink-muted';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Element inside the right edge (e.g. a show-password button). */
  trailing?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, trailing, className, id, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-ink">{label}</label>}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(CONTROL, 'h-12 px-4 text-base', trailing ? 'pr-12' : '', error && 'border-alert')}
          {...rest}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {error ? <p id={`${inputId}-error`} className="mt-2 text-sm text-alert">{error}</p>
        : hint ? <p id={`${inputId}-hint`} className="mt-2 text-sm text-ink-muted">{hint}</p> : null}
    </div>
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, className, id, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-ink">{label}</label>}
      <textarea ref={ref} id={inputId} className={cx(CONTROL, 'block min-h-32 resize-y px-4 py-3 text-base leading-normal')} {...rest} />
    </div>
  );
});

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  /** Accessible name when there's no visible label. */
  ariaLabel?: string;
  className?: string;
}

export function Checkbox({ checked, onChange, label, ariaLabel, className }: CheckboxProps) {
  return (
    <label className={cx('inline-flex cursor-pointer items-center gap-3', className)}>
      <span className="relative inline-flex size-6 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          aria-label={ariaLabel}
          className="peer absolute inset-0 m-0 cursor-pointer opacity-0"
        />
        <span
          aria-hidden
          className={cx(
            'flex size-6 items-center justify-center rounded-check border transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-basil peer-focus-visible:ring-offset-2',
            checked ? 'border-basil bg-basil text-surface' : 'border-ink-muted/60 bg-surface',
          )}
        >
          {checked && <Check size={16} strokeWidth={2.5} className="animate-check" />}
        </span>
      </span>
      {label && <span className="text-base text-ink">{label}</span>}
    </label>
  );
}

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  /** Text after the number ("people"). */
  unit?: (n: number) => string;
}

export function Stepper({ value, onChange, min = 1, max = 20, label, unit }: StepperProps) {
  return (
    <div role="group" aria-label={label} className="inline-flex h-11 items-center rounded-control border border-line bg-surface">
      <button
        type="button"
        aria-label={`Fewer ${label.toLowerCase()}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-full w-11 cursor-pointer items-center justify-center text-ink disabled:cursor-not-allowed disabled:text-line"
      >
        <Minus {...ICON_PROPS} />
      </button>
      <output aria-live="polite" className="tabular min-w-24 px-2 text-center text-base font-semibold">
        {value}{unit ? ` ${unit(value)}` : ''}
      </output>
      <button
        type="button"
        aria-label={`More ${label.toLowerCase()}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-full w-11 cursor-pointer items-center justify-center text-ink disabled:cursor-not-allowed disabled:text-line"
      >
        <Plus {...ICON_PROPS} />
      </button>
    </div>
  );
}

export interface SegmentedProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

/** A small set of mutually exclusive choices: Ingredients / Steps, 1x / 2x / 3x, US / Metric. */
export function Segmented<T extends string>({ options, value, onChange, label, className }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cx('inline-flex rounded-control border border-line bg-canvas p-1', className)}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'h-9 flex-1 cursor-pointer whitespace-nowrap rounded-[7px] px-4 text-sm font-semibold transition-colors duration-150',
              active ? 'bg-surface text-ink ring-1 ring-line' : 'text-ink-muted hover:text-ink',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
