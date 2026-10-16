import { useEffect, useState } from 'react';
import { Pause, Play, Plus, Timer as TimerIcon, X } from 'lucide-react';
import { cx } from './ds';
import {
  addMinute, findTimer, formatClock, pauseTimer, remainingMs, removeTimer, resumeTimer, startTimer, useTimers, type Timer,
} from '../lib/timers';
import type { StepTimer } from '../lib/catalog';

/** Re-renders every half second while anything is counting down. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

/**
 * Inline chip for one duration in a step ("Soak 30 min"). Tapping starts a timer;
 * while it runs the chip shows the time left and opens nothing else (the tray has controls).
 */
export function TimerChip({ timer, recipeId, recipeTitle, size = 'md' }: { timer: StepTimer; recipeId: number; recipeTitle: string; size?: 'md' | 'lg' }) {
  const timers = useTimers();
  const existing = findTimer(timers, recipeId, timer.label);
  const now = useNow(!!existing && existing.endAt !== null);
  const base = cx(
    'inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border font-semibold transition-colors duration-150',
    size === 'lg' ? 'h-12 px-5 text-base' : 'h-9 px-3.5 text-sm',
  );
  if (existing) {
    return (
      <button
        type="button"
        onClick={() => (existing.done ? removeTimer(existing.id) : existing.endAt === null ? resumeTimer(existing.id) : pauseTimer(existing.id))}
        aria-label={`${timer.label}: ${existing.done ? 'done, dismiss' : `${formatClock(remainingMs(existing, now))} left, ${existing.endAt === null ? 'resume' : 'pause'}`}`}
        className={cx(base, 'border-ink bg-ink text-surface', existing.done && 'animate-flash')}
      >
        <TimerIcon size={size === 'lg' ? 20 : 16} strokeWidth={1.75} aria-hidden className="text-yolk" />
        <span>{timer.label.replace(/\s[\d-]+\s?(min|hr|sec).*$/, '')}</span>
        <span className="tabular font-display text-yolk">{existing.done ? 'Done' : formatClock(remainingMs(existing, now))}</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => startTimer({ label: timer.label, seconds: timer.seconds, recipeId, recipeTitle })}
      aria-label={`Start timer: ${timer.label}`}
      className={cx(base, 'border-line bg-surface text-ink hover:border-ink-muted')}
    >
      <TimerIcon size={size === 'lg' ? 20 : 16} strokeWidth={1.75} aria-hidden className="text-ink-muted" />
      {timer.label}
    </button>
  );
}

function TrayRow({ t, now }: { t: Timer; now: number }) {
  const paused = t.endAt === null && !t.done;
  return (
    <li className={cx('flex items-center gap-2 py-2', t.done && 'animate-flash')}>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-surface">{t.label}</span>
        <span className="block truncate text-xs text-surface/70">{t.recipeTitle}</span>
      </span>
      <span className="tabular font-display text-xl font-semibold text-yolk" aria-live={t.done ? 'assertive' : 'off'}>
        {t.done ? 'Done' : formatClock(remainingMs(t, now))}
      </span>
      {!t.done && (
        <button type="button" onClick={() => (paused ? resumeTimer(t.id) : pauseTimer(t.id))} aria-label={`${paused ? 'Resume' : 'Pause'} ${t.label}`}
          className="flex size-9 cursor-pointer items-center justify-center rounded-full text-surface hover:bg-surface/10">
          {paused ? <Play size={18} strokeWidth={1.75} aria-hidden /> : <Pause size={18} strokeWidth={1.75} aria-hidden />}
        </button>
      )}
      <button type="button" onClick={() => addMinute(t.id)} aria-label={`Add 1 minute to ${t.label}`}
        className="flex h-9 cursor-pointer items-center gap-0.5 rounded-full px-2 text-sm font-semibold text-surface hover:bg-surface/10">
        <Plus size={16} strokeWidth={1.75} aria-hidden />1 min
      </button>
      <button type="button" onClick={() => removeTimer(t.id)} aria-label={t.done ? `Dismiss ${t.label}` : `Cancel ${t.label}`}
        className="flex size-9 cursor-pointer items-center justify-center rounded-full text-surface hover:bg-surface/10">
        <X size={18} strokeWidth={1.75} aria-hidden />
      </button>
    </li>
  );
}

/** Floating tray of running timers, on every screen. Sits above the tab bar on phones. */
export function TimerTray() {
  const timers = useTimers();
  const now = useNow(timers.some(t => t.endAt !== null));
  if (!timers.length) return null;
  return (
    <section
      aria-label="Timers"
      className="fixed right-4 z-[45] w-[min(360px,calc(100vw-32px))] rounded-control bg-ink px-4 py-1 shadow-float"
      style={{ bottom: 'calc(var(--tray-offset, 0px) + 16px)' }}
    >
      <ul className="divide-y divide-surface/15">
        {timers.map(t => <TrayRow key={t.id} t={t} now={now} />)}
      </ul>
    </section>
  );
}
