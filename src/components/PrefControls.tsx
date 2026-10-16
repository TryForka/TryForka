import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { ALLERGENS, ALLERGEN_LABELS, type Allergen } from '../lib/allergenLabels';
import type { DietChoice, Preferences } from '../lib/preferences';
import { Button, Checkbox, Input, RemovableTag, ToggleChip } from './ds';

// The food-settings controls, shared by onboarding and Settings so both write the
// same fields.

const DIET_OPTIONS: Array<{ value: DietChoice; label: string; hint: string }> = [
  { value: 'none', label: 'No restrictions', hint: 'Everything' },
  { value: 'vegetarian', label: 'Vegetarian', hint: 'No meat or fish' },
  { value: 'vegan', label: 'Vegan', hint: 'No animal products' },
  { value: 'pescatarian', label: 'Pescatarian', hint: 'Fish, no meat' },
];

export function DietPicker({ value, onChange }: { value: DietChoice; onChange: (d: DietChoice) => void }) {
  return (
    <div role="radiogroup" aria-label="Diet" className="grid gap-2 sm:grid-cols-2">
      {DIET_OPTIONS.map(o => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-control border px-4 py-3 text-left transition-colors duration-150 ${selected ? 'border-basil bg-basil-soft' : 'border-line bg-surface hover:border-ink-muted'}`}
          >
            <span>
              <span className={`block text-base font-semibold ${selected ? 'text-basil' : 'text-ink'}`}>{o.label}</span>
              <span className="block text-sm text-ink-muted">{o.hint}</span>
            </span>
            <span aria-hidden className={`size-5 shrink-0 rounded-full border-2 ${selected ? 'border-basil bg-basil shadow-[inset_0_0_0_3px_var(--color-basil-soft)]' : 'border-ink-muted/60'}`} />
          </button>
        );
      })}
    </div>
  );
}

export function AllergyPicker({ value, onChange }: { value: Allergen[]; onChange: (a: Allergen[]) => void }) {
  const toggle = (a: Allergen) => onChange(value.includes(a) ? value.filter(x => x !== a) : [...value, a]);
  return (
    <div role="group" aria-label="Allergies" className="flex flex-wrap gap-2">
      {ALLERGENS.map(a => (
        <ToggleChip key={a} selected={value.includes(a)} onToggle={() => toggle(a)}>{ALLERGEN_LABELS[a]}</ToggleChip>
      ))}
    </div>
  );
}

export function SkipList({ value, onChange }: { value: string[]; onChange: (s: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const add = (e: FormEvent) => {
    e.preventDefault();
    const words = draft.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length >= 2 && !value.includes(w));
    if (words.length) onChange([...value, ...words]);
    setDraft('');
  };
  return (
    <div>
      <form onSubmit={add} className="flex max-w-md items-end gap-2">
        <Input className="flex-1" label="Add an ingredient" placeholder="mushrooms, olives" value={draft} onChange={e => setDraft(e.target.value)} />
        <Button type="submit" variant="secondary" icon={Plus} disabled={!draft.trim()} className="h-12">Add</Button>
      </form>
      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map(w => (
            <RemovableTag key={w} onRemove={() => onChange(value.filter(x => x !== w))} removeLabel={`Remove ${w}`}>{w}</RemovableTag>
          ))}
        </div>
      )}
    </div>
  );
}

const TIME_OPTIONS: Array<{ value: number | null; label: string }> = [
  { value: 30, label: '30 min' }, { value: 45, label: '45 min' }, { value: 60, label: '1 hour' }, { value: null, label: 'No limit' },
];

type Planning = Pick<Preferences, 'plan_breakfast' | 'plan_lunch' | 'plan_dinner' | 'max_weeknight_minutes'>;

export function PlanningPicker({ value, onChange }: { value: Planning; onChange: (p: Partial<Planning>) => void }) {
  const meals: Array<[keyof Planning, string]> = [['plan_breakfast', 'Breakfast'], ['plan_lunch', 'Lunch'], ['plan_dinner', 'Dinner']];
  const onlyOne = [value.plan_breakfast, value.plan_lunch, value.plan_dinner].filter(Boolean).length === 1;
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink">Meals to plan</legend>
        <div className="flex flex-wrap gap-6">
          {meals.map(([key, label]) => (
            <Checkbox
              key={key}
              checked={!!value[key]}
              // At least one meal stays on.
              onChange={checked => { if (checked || !onlyOne || !value[key]) onChange({ [key]: checked }); }}
              label={label}
            />
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink">Weeknight dinners take at most</legend>
        <div role="radiogroup" aria-label="Weeknight cook time" className="flex flex-wrap gap-2">
          {TIME_OPTIONS.map(o => (
            <ToggleChip key={o.label} role="radio" selected={value.max_weeknight_minutes === o.value} onToggle={() => onChange({ max_weeknight_minutes: o.value })}>
              {o.label}
            </ToggleChip>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
