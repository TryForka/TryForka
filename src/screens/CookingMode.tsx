import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../app/AppContext';
import { getRecipe, recipeTitle, type Recipe } from '../lib/catalog';
import { markCooked } from '../lib/cooked';
import { TimerChip } from '../components/Timers';
import { Button, cx, IconButton, Skeleton } from '../components/ds';

// One step per screen, readable from across the counter. Arrow keys and space move on
// desktop; the screen stays awake while this is open.

function useWakeLock() {
  useEffect(() => {
    type Sentinel = { release: () => Promise<void> };
    const nav = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<Sentinel> } };
    if (!nav.wakeLock) return;
    let lock: Sentinel | null = null;
    let active = true;
    const acquire = async () => {
      try { if (active && document.visibilityState === 'visible') lock = await nav.wakeLock!.request('screen'); } catch { /* denied or unsupported */ }
    };
    // The lock drops when the tab is hidden; take it again on return.
    const onVisible = () => { if (document.visibilityState === 'visible') void acquire(); };
    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release().catch(() => {});
    };
  }, []);
}

export function CookingMode({ id }: { id: number }) {
  const { prefs, userId, replace, back } = useApp();
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined);
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useWakeLock();

  useEffect(() => { getRecipe(id).then(setRecipe).catch(() => setRecipe(null)); }, [id]);

  const total = recipe?.steps.length ?? 0;
  const last = step >= total - 1;

  const finish = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await markCooked(userId, id);
      setFinished(true);
    } catch {
      setError("Couldn't mark it as cooked. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }, [userId, id]);

  const next = useCallback(() => { if (last) void finish(); else setStep(s => Math.min(total - 1, s + 1)); }, [last, finish, total]);
  const prev = useCallback(() => setStep(s => Math.max(0, s - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Space on a focused button presses that button instead.
      if (e.key === ' ' && e.target instanceof HTMLButtonElement) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, finished]);

  if (recipe === undefined) {
    return <div className="p-6"><Skeleton className="h-2 w-full" /><Skeleton className="mt-10 h-24 w-2/3" /></div>;
  }
  if (!recipe || !total) {
    return (
      <div className="p-6">
        <IconButton icon={X} label="Close cooking mode" onClick={back} />
        <p className="mt-6 text-base text-ink-muted">{recipe ? 'This recipe has no written steps.' : "Couldn't load this recipe. Check your connection."}</p>
      </div>
    );
  }

  const title = recipeTitle(recipe);
  const current = recipe.steps[step];

  if (finished) {
    return (
      <div className="flex min-h-dvh flex-col justify-center px-6 py-10 md:px-16">
        <div className="max-w-[560px]">
          <p className="text-sm font-semibold text-basil">Marked as cooked</p>
          <h1 className="mt-2 text-2xl text-ink md:text-4xl">{title} is done. Enjoy.</h1>
          <p className="mt-3 text-base text-ink-muted">How did it turn out? A rating helps us suggest what your household likes.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => replace({ name: 'rate', id })}>Rate this recipe</Button>
            <Button size="lg" variant="secondary" onClick={back}>Back to recipe</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="px-4 pt-4 md:px-8 md:pt-6">
        <div className="flex items-center gap-3">
          <IconButton icon={X} label="Close cooking mode" onClick={back} className="-ml-2" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-muted">{title}</p>
        </div>
        <div aria-hidden className="mt-3 flex gap-1">
          {recipe.steps.map((_, i) => <span key={i} className={cx('h-1.5 flex-1 rounded-full', i <= step ? 'bg-basil' : 'bg-line')} />)}
        </div>
      </header>

      <div className="flex-1 px-4 pt-8 pb-10 md:px-8 md:pt-14">
        <p className="text-base font-semibold text-ink-muted" aria-live="polite">Step {step + 1} of {total}</p>
        <p className="mt-4 max-w-[60ch] text-xl leading-snug font-medium text-ink md:text-3xl md:leading-snug">
          {prefs.units === 'metric' ? current.text_metric : current.text_us}
        </p>
        {current.timers.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {current.timers.map(t => <TimerChip key={t.label} timer={t} recipeId={recipe.id} recipeTitle={title} size="lg" />)}
          </div>
        )}
        {error && <p role="alert" className="mt-6 text-sm text-alert">{error}</p>}
      </div>

      <div className="sticky bottom-0 border-t border-line bg-surface px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] md:px-8">
        <div className="flex gap-3">
          <Button size="lg" variant="secondary" className="flex-1" onClick={prev} disabled={step === 0}>Back</Button>
          <Button size="lg" className="flex-1" onClick={next} loading={saving}>{last ? 'Done' : 'Next'}</Button>
        </div>
      </div>
    </div>
  );
}
