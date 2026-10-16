import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { CalendarPlus, ChevronDown, Copy, Plus, Share2, ShoppingCart, X } from 'lucide-react';
import { useApp } from '../app/AppContext';
import {
  fetchGroceryList, listMatchesPlan, rebuildGroceryList, saveChecked, saveCustomItems, type CustomItem, type SavedGroceryList,
} from '../lib/groceries';
import { AISLES, amountLines, listText, STAPLES_GROUP, uniqueMeals, type GroceryItem } from '../lib/groceryMerge';
import { planEntries } from '../lib/plan';
import { Button, Checkbox, cx, EmptyState, IconButton, PageContainer, Progress, Skeleton } from '../components/ds';

// The week's grocery list: by aisle, what you need first; checked items drop into
// "Got it" under their aisle; staples sit in "Probably have it" at the bottom.

function ItemRow({ item, checked, onToggle, units }: { item: GroceryItem; checked: boolean; onToggle: () => void; units: 'us' | 'metric' }) {
  const [open, setOpen] = useState(false);
  const meals = uniqueMeals(item);
  const lines = amountLines(item, units);
  const notes = item.notes.filter(n => n.text);
  return (
    <li className="flex items-start gap-3 border-b border-line py-3">
      <Checkbox checked={checked} onChange={onToggle} ariaLabel={item.name} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        {/* The checkbox is the control; tapping the name toggles too (mouse/touch convenience). */}
        <span onClick={onToggle} className={cx('block cursor-pointer text-base', checked ? 'text-ink-muted line-through' : 'text-ink')}>
          {item.name}
        </span>
        {meals.length > 1 ? (
          <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)} className="cursor-pointer text-sm text-ink-muted hover:text-ink">
            for {meals.length} meals
          </button>
        ) : meals.length === 1 && !lines.length && !notes.length ? (
          <span className="block text-sm text-ink-muted">for {meals[0]}</span>
        ) : null}
        {open && <ul className="mt-1 text-sm text-ink-muted">{meals.map(m => <li key={m}>{m}</li>)}</ul>}
      </div>
      <div className={cx('max-w-[46%] shrink-0 text-right', checked && 'text-ink-muted line-through')}>
        {lines.map(l => <span key={l} className="tabular block text-base">{l}</span>)}
        {notes.map((n, i) => (
          <span key={i} className="block text-sm text-ink-muted">{n.text}{meals.length > 1 || lines.length ? `, ${n.recipe}` : ''}</span>
        ))}
      </div>
    </li>
  );
}

function GotIt({ count, children }: { count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  if (!count) return null;
  return (
    <div>
      <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)} className="flex w-full cursor-pointer items-center gap-2 py-3 text-sm font-semibold text-ink-muted hover:text-ink">
        <ChevronDown size={18} strokeWidth={1.75} aria-hidden className={cx('transition-transform duration-150', open && 'rotate-180')} />
        Got it ({count})
      </button>
      {open && <ul className="border-t border-line">{children}</ul>}
    </div>
  );
}

export function Groceries() {
  const { userId, weekPlan, prefs, go } = useApp();
  const [list, setList] = useState<SavedGroceryList | null>(null);
  const [status, setStatus] = useState<'loading' | 'building' | 'ready' | 'error'>('loading');
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState<CustomItem[]>([]);
  const [draft, setDraft] = useState('');
  const [saveError, setSaveError] = useState(false);
  const [shareState, setShareState] = useState<string | null>(null);
  const [staplesOpen, setStaplesOpen] = useState(false);
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (weekPlan === undefined) return;
    let cancelled = false;
    (async () => {
      setStatus('loading');
      try {
        let current = await fetchGroceryList(userId);
        if (weekPlan && !listMatchesPlan(current, weekPlan)) {
          if (!cancelled) setStatus('building');
          current = await rebuildGroceryList(userId, weekPlan, current);
        }
        if (cancelled) return;
        setList(current);
        setChecked(new Set(current?.checked ?? []));
        setCustom(current?.custom ?? []);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [userId, weekPlan]);

  /** Saves run one after another so a slow request can't overwrite a newer change. */
  const persist = (fn: () => Promise<void>) => {
    queue.current = queue.current.then(fn).then(() => setSaveError(false)).catch(() => setSaveError(true));
  };

  const toggle = (key: string) => {
    const next = new Set(checked);
    if (next.has(key)) next.delete(key); else next.add(key);
    setChecked(next);
    const snapshot = [...next];
    persist(() => saveChecked(userId, snapshot));
  };

  const addItem = (e: FormEvent) => {
    e.preventDefault();
    const name = draft.trim();
    if (!name) return;
    const next = [...custom, { key: `custom:${Date.now().toString(36)}`, name: name.charAt(0).toUpperCase() + name.slice(1) }];
    setCustom(next);
    setDraft('');
    const snapshot = [...checked];
    persist(() => saveCustomItems(userId, next, snapshot));
  };

  const removeItem = (key: string) => {
    const next = custom.filter(c => c.key !== key);
    const nextChecked = new Set(checked); nextChecked.delete(key);
    setCustom(next); setChecked(nextChecked);
    const snapshot = [...nextChecked];
    persist(() => saveCustomItems(userId, next, snapshot));
  };

  const items = useMemo(() => list?.items ?? [], [list]);
  const toBuy = items.filter(i => !i.staple);
  const staples = items.filter(i => i.staple);
  const countable = [...toBuy.map(i => i.key), ...custom.map(c => c.key)];
  const done = countable.filter(k => checked.has(k)).length;
  const mealCount = weekPlan ? planEntries(weekPlan.plan).length : 0;

  const text = () => listText(items, custom, checked, prefs.units);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text()); setShareState('Copied'); } catch { setShareState("Couldn't copy. Select the list and copy it instead."); }
    window.setTimeout(() => setShareState(null), 2500);
  };
  const share = async () => {
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title: 'Grocery list', text: text() }); return; } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    await copy();
  };

  if (weekPlan === null || (status === 'ready' && !list && !custom.length)) {
    return (
      <PageContainer title="Grocery list">
        <EmptyState title="No grocery list yet" action={<Button icon={CalendarPlus} onClick={() => go({ name: 'mealplan' })}>Plan your week</Button>}>
          Plan your week and the list builds itself from the meals, sorted by aisle.
        </EmptyState>
      </PageContainer>
    );
  }

  const actions = status === 'ready' ? (
    <>
      <Button size="sm" variant="secondary" icon={Copy} onClick={copy}>Copy list</Button>
      <Button size="sm" variant="secondary" icon={Share2} onClick={share}>Share</Button>
    </>
  ) : undefined;

  return (
    <PageContainer title="Grocery list" actions={actions}>
      {status === 'loading' || status === 'building' ? (
        <div aria-busy>
          <p className="mb-4 text-base text-ink-muted">{status === 'building' ? "Building your list from this week's meals…" : 'Loading your list…'}</p>
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="mb-3 h-10 w-full" />)}
        </div>
      ) : status === 'error' ? (
        <p role="alert" className="text-base text-alert">Couldn't load your grocery list. Check your connection and try again.</p>
      ) : (
        <>
          <div className="mb-6 -mt-2">
            <p className="mb-2 text-base text-ink-muted">{mealCount} meal{mealCount === 1 ? '' : 's'} this week</p>
            <Progress value={countable.length ? done / countable.length : 0} label={`${done} of ${countable.length} items checked`} />
            <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-basil">{shareState}</p>
            {saveError && <p role="alert" className="text-sm text-alert">Couldn't save your last change. It'll retry with the next one.</p>}
          </div>

          <form onSubmit={addItem} className="mb-8 flex max-w-xl gap-2">
            <label htmlFor="add-item" className="sr-only">Add an item</label>
            <input id="add-item" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add an item, like paper towels"
              className="h-12 min-w-0 flex-1 rounded-control border border-line bg-surface px-4 text-base outline-none focus:border-basil focus:ring-2 focus:ring-basil/25" />
            <Button type="submit" variant="secondary" icon={Plus} className="h-12" disabled={!draft.trim()}>Add</Button>
          </form>

          {custom.length > 0 && (
            <section className="mb-8" aria-labelledby="aisle-custom">
              <h2 id="aisle-custom" className="mb-1 text-lg text-ink">Added by you</h2>
              <ul className="border-t border-line">
                {custom.filter(c => !checked.has(c.key)).map(c => (
                  <li key={c.key} className="flex items-center gap-3 border-b border-line py-2">
                    <Checkbox checked={false} onChange={() => toggle(c.key)} ariaLabel={c.name} />
                    <span className="flex-1 text-base text-ink">{c.name}</span>
                    <IconButton icon={X} label={`Remove ${c.name}`} size={36} onClick={() => removeItem(c.key)} />
                  </li>
                ))}
              </ul>
              <GotIt count={custom.filter(c => checked.has(c.key)).length}>
                {custom.filter(c => checked.has(c.key)).map(c => (
                  <li key={c.key} className="flex items-center gap-3 border-b border-line py-2">
                    <Checkbox checked onChange={() => toggle(c.key)} ariaLabel={c.name} />
                    <span className="flex-1 text-base text-ink-muted line-through">{c.name}</span>
                    <IconButton icon={X} label={`Remove ${c.name}`} size={36} onClick={() => removeItem(c.key)} />
                  </li>
                ))}
              </GotIt>
            </section>
          )}

          {AISLES.map(aisle => {
            const inAisle = toBuy.filter(i => i.aisle === aisle);
            if (!inAisle.length) return null;
            const left = inAisle.filter(i => !checked.has(i.key));
            const got = inAisle.filter(i => checked.has(i.key));
            return (
              <section key={aisle} className="mb-8" aria-labelledby={`aisle-${aisle}`}>
                <h2 id={`aisle-${aisle}`} className="mb-1 text-lg text-ink">{aisle}</h2>
                {left.length > 0 && <ul className="border-t border-line">{left.map(i => <ItemRow key={i.key} item={i} checked={false} onToggle={() => toggle(i.key)} units={prefs.units} />)}</ul>}
                {!left.length && <p className="border-t border-line py-3 text-sm text-ink-muted">All checked off.</p>}
                <GotIt count={got.length}>
                  {got.map(i => <ItemRow key={i.key} item={i} checked onToggle={() => toggle(i.key)} units={prefs.units} />)}
                </GotIt>
              </section>
            );
          })}

          {staples.length > 0 && (
            <section className="mb-8">
              <button type="button" aria-expanded={staplesOpen} onClick={() => setStaplesOpen(o => !o)}
                className="flex w-full cursor-pointer items-center gap-2 border-b border-line pb-2 text-left">
                <span className="flex-1 font-display text-lg font-semibold tracking-[-0.01em] text-ink">{STAPLES_GROUP}</span>
                <span className="text-sm text-ink-muted">{staples.length} items</span>
                <ChevronDown size={20} strokeWidth={1.75} aria-hidden className={cx('text-ink-muted transition-transform duration-150', staplesOpen && 'rotate-180')} />
              </button>
              {staplesOpen && <ul>{staples.map(i => <ItemRow key={i.key} item={i} checked={checked.has(i.key)} onToggle={() => toggle(i.key)} units={prefs.units} />)}</ul>}
            </section>
          )}

          <Button variant="secondary" icon={ShoppingCart} disabled>Instacart coming soon</Button>
        </>
      )}
    </PageContainer>
  );
}
