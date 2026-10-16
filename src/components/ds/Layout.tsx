import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { cx } from './cx';
import { IconButton } from './Button';
import { ICON_PROPS } from './icon';

// Page structure shared by every main screen.

export interface PageContainerProps {
  title?: React.ReactNode;
  /** Shown left of the title. */
  onBack?: () => void;
  backLabel?: string;
  /** Right side of the header row (text buttons, icons). */
  actions?: React.ReactNode;
  /** Line under the title. */
  intro?: React.ReactNode;
  children: React.ReactNode;
  /** Sticky action bar at the bottom of the content column. */
  bottomBar?: React.ReactNode;
  className?: string;
}

/** Max 960px, left aligned, one header row (optional back button + H1). */
export function PageContainer({ title, onBack, backLabel = 'Back', actions, intro, children, bottomBar, className }: PageContainerProps) {
  return (
    <div className="flex min-h-full flex-col">
      <div className={cx('w-full max-w-[960px] flex-1 px-4 pt-6 pb-12 md:px-8 md:pt-8', className)}>
        {(title || onBack || actions) && (
          <header className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {onBack && <IconButton icon={ArrowLeft} label={backLabel} onClick={onBack} className="-ml-2" />}
              {title && <h1 className="min-w-0 text-2xl text-ink md:text-4xl">{title}</h1>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-1">{actions}</div>}
          </header>
        )}
        {intro && <div className="-mt-3 mb-6 text-base text-ink-muted">{intro}</div>}
        {children}
      </div>
      {bottomBar && <BottomBar>{bottomBar}</BottomBar>}
    </div>
  );
}

/** Sticky to the bottom of the content column, full content width, 52px buttons. */
export function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 w-full border-t border-line bg-surface">
      <div className="flex w-full max-w-[960px] gap-3 px-4 py-3 md:px-8">{children}</div>
    </div>
  );
}

export function SectionHeading({ children, action, id }: { children: React.ReactNode; action?: React.ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 id={id} className="text-lg text-ink">{children}</h2>
      {action}
    </div>
  );
}

export interface ListRowProps {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  /** Show a chevron for rows that open something. */
  chevron?: boolean;
  className?: string;
}

/** Plain row separated by a line border. Clickable rows are buttons. */
export function ListRow({ leading, title, subtitle, trailing, onClick, chevron, className }: ListRowProps) {
  const body = (
    <>
      {leading}
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-base font-medium text-ink">{title}</span>
        {subtitle && <span className="block text-sm text-ink-muted">{subtitle}</span>}
      </span>
      {trailing}
      {chevron && <ChevronRight {...ICON_PROPS} className="shrink-0 text-ink-muted" />}
    </>
  );
  const base = cx('flex w-full items-center gap-3 border-b border-line py-3', className);
  return onClick
    ? <button type="button" onClick={onClick} className={cx(base, 'cursor-pointer hover:bg-basil-soft/40')}>{body}</button>
    : <div className={base}>{body}</div>;
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="border-y border-line py-10">
      <h2 className="text-lg text-ink">{title}</h2>
      {children && <p className="mt-2 max-w-[56ch] text-base text-ink-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Progress({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full bg-basil transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Quiet status text ("Saved", "Saving…", errors). */
export function SaveStatus({ state, error }: { state: 'idle' | 'saving' | 'saved' | 'error'; error?: string }) {
  return (
    <span role="status" aria-live="polite" className={cx('text-sm', state === 'error' ? 'text-alert' : 'text-ink-muted')}>
      {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : state === 'error' ? (error ?? "Couldn't save. Check your connection.") : ''}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx('rounded-photo bg-line/60', className)} />;
}
