import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from './cx';
import { ICON_PROPS } from './icon';

// Buttons. Sentence-case labels that say what happens ("Add to week", "Start cooking").
// Sizes: lg 52px (bottom bars), md 44px (default), sm 36px (inline actions).

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'danger-quiet';
type Size = 'lg' | 'md' | 'sm';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-basil text-surface hover:bg-basil/90 disabled:bg-line disabled:text-ink-muted',
  secondary: 'bg-surface text-ink border border-line hover:border-ink-muted disabled:text-ink-muted',
  quiet: 'bg-transparent text-basil hover:bg-basil-soft disabled:text-ink-muted',
  danger: 'bg-alert text-surface hover:bg-alert/90 disabled:bg-line disabled:text-ink-muted',
  'danger-quiet': 'bg-transparent text-alert hover:bg-alert/10 disabled:text-ink-muted',
};
const SIZES: Record<Size, string> = {
  lg: 'h-[52px] px-6 text-base gap-2',
  md: 'h-11 px-4 text-base gap-2',
  sm: 'h-9 px-3 text-sm gap-1.5',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  /** Icon after the label instead of before. */
  iconEnd?: LucideIcon;
  loading?: boolean;
  block?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon: Icon, iconEnd: IconEnd, loading, block, className, children, disabled, ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-control font-semibold whitespace-nowrap select-none',
        'transition-colors duration-150 disabled:cursor-not-allowed cursor-pointer',
        VARIANTS[variant], SIZES[size], block && 'w-full', className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : Icon && <Icon {...ICON_PROPS} size={size === 'sm' ? 18 : 20} />}
      {children}
      {IconEnd && <IconEnd {...ICON_PROPS} size={size === 'sm' ? 18 : 20} />}
    </button>
  );
});

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  /** Accessible name; required because there's no visible text. */
  label: string;
  variant?: 'plain' | 'outlined' | 'overlay';
  size?: 36 | 40 | 44;
  pressed?: boolean;
}

export function IconButton({ icon: Icon, label, variant = 'plain', size = 44, pressed, className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-control cursor-pointer transition-colors duration-150',
        variant === 'plain' && 'text-ink hover:bg-basil-soft',
        variant === 'outlined' && 'bg-surface border border-line text-ink hover:border-ink-muted',
        variant === 'overlay' && 'bg-surface/95 text-ink hover:bg-surface',
        className,
      )}
      style={{ width: size, height: size }}
      {...rest}
    >
      <Icon {...ICON_PROPS} />
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cx('inline-block size-4 rounded-full border-2 border-current border-r-transparent animate-spin', className)}
    />
  );
}
