import React from 'react';
import { Check, X } from 'lucide-react';
import { cx } from './cx';

// Fully rounded: tags (static info), toggle chips (multi-select), filter chips (single-select).

export function Tag({ children, tone = 'neutral', className }: { children: React.ReactNode; tone?: 'neutral' | 'basil' | 'alert'; className?: string }) {
  return (
    <span className={cx(
      'inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-sm font-medium whitespace-nowrap',
      tone === 'neutral' && 'border border-line bg-surface text-ink-muted',
      tone === 'basil' && 'bg-basil-soft text-basil',
      tone === 'alert' && 'bg-alert/10 text-alert',
      className,
    )}>
      {children}
    </span>
  );
}

export interface ToggleChipProps {
  selected: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  /** Single-choice chips (filters) use radio semantics instead of pressed buttons. */
  role?: 'radio';
}

export function ToggleChip({ selected, onToggle, children, role }: ToggleChipProps) {
  return (
    <button
      type="button"
      role={role}
      aria-pressed={role ? undefined : selected}
      aria-checked={role ? selected : undefined}
      onClick={onToggle}
      className={cx(
        'inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-base font-medium whitespace-nowrap transition-colors duration-150',
        selected ? 'border-basil bg-basil-soft text-basil' : 'border-line bg-surface text-ink hover:border-ink-muted',
      )}
    >
      {selected && !role && <Check size={16} strokeWidth={2.25} aria-hidden className="animate-check" />}
      {children}
    </button>
  );
}

/** A removable tag for free-text lists ("mushrooms", "olives"). */
export function RemovableTag({ children, onRemove, removeLabel }: { children: React.ReactNode; onRemove: () => void; removeLabel: string }) {
  return (
    <span className="inline-flex h-9 items-center gap-1 rounded-full border border-line bg-surface pr-1 pl-3 text-base text-ink">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="flex size-7 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-canvas hover:text-ink"
      >
        <X size={16} strokeWidth={1.75} aria-hidden />
      </button>
    </span>
  );
}

/** A chip that does something when tapped (starter prompts), not a toggle. */
export function ChipButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 shrink-0 cursor-pointer items-center rounded-full border border-line bg-surface px-4 text-base font-medium whitespace-nowrap text-ink transition-colors duration-150 hover:border-ink-muted"
    >
      {children}
    </button>
  );
}
