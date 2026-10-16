// Grocery merge tests, built from the cases that were wrong on the old list
// (docs/screens: "Coriander, for 7 meals, 1/2 cup", "Cherry Tomatoes 500 g + 6",
// "Blackberries" with nothing, "Basil, small pack").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { amountLines, combine, itemKey, listText, type MergeIngredient, type MergeRecipe } from '../src/lib/groceryMerge.ts';
import { parseMeasure } from '../supabase/functions/_shared/catalog/units.ts';
import { usIngredientName } from '../supabase/functions/_shared/catalog/names.ts';

function ing(name: string, measure: string): MergeIngredient {
  const m = parseMeasure(measure);
  return { name, name_us: usIngredientName(name, measure), measure_raw: measure, quantity: m.quantity, quantity_max: m.quantityMax, unit: m.unit };
}
const recipe = (id: number, title: string, ...ingredients: MergeIngredient[]): MergeRecipe => ({ id, title, ingredients });
const aisle = () => undefined;
const find = (items: ReturnType<typeof combine>, key: string) => items.find(i => i.key === key)!;

test('cilantro across 7 meals sums every amount instead of showing one recipe\'s', () => {
  const items = combine([
    recipe(1, 'Tacos', ing('Coriander', '1/2 cup')),
    recipe(2, 'Curry', ing('Coriander', 'Handful')),
    recipe(3, 'Dal', ing('Coriander', '2 tbs chopped')),
    recipe(4, 'Salsa', ing('Fresh Coriander', '1 bunch')),
    recipe(5, 'Rice', ing('Coriander Leaves', '1 tbsp')),
    recipe(6, 'Soup', ing('Coriander', '')),
    recipe(7, 'Bowl', ing('Coriander', '1/4 cup')),
  ], aisle);
  const cilantro = find(items, 'cilantro');
  assert.equal(new Set(cilantro.meals).size, 7);
  // 1/2 cup + 2 tbsp + 1 tbsp + 1/4 cup = 120 + 30 + 15 + 60 = 225 ml -> about 1 cup
  assert.deepEqual(amountLines(cilantro, 'us'), ['1 cup', '1 bunch']);
  assert.deepEqual(cilantro.notes, [{ text: 'Handful', recipe: 'Curry' }]);
});

test('cherry tomatoes: grams and a bare count stay on separate lines', () => {
  const items = combine([
    recipe(1, 'Pasta', ing('Cherry Tomatoes', '500g')),
    recipe(2, 'Salad', ing('Cherry Tomatoes', '6')),
    recipe(3, 'Bake', ing('Cherry Tomatoes', '250g')),
  ], aisle);
  assert.deepEqual(amountLines(find(items, 'cherry tomato'), 'us'), ['1 3/4 lb', '6 whole']);
  assert.deepEqual(amountLines(find(items, 'cherry tomato'), 'metric'), ['750 g', '6 whole']);
});

test('weights in different units add up', () => {
  const items = combine([
    recipe(1, 'A', ing('Potatoes', '900g')),
    recipe(2, 'B', ing('Potatoes', '1 lb')),
    recipe(3, 'C', ing('Potatoes', '0.5kg')),
  ], aisle);
  assert.deepEqual(amountLines(find(items, 'potato'), 'us'), ['4 lb']);
});

test('garlic cloves from different spellings combine (a bare count on "Garlic Clove" is cloves)', () => {
  const items = combine([
    recipe(1, 'A', ing('Garlic', '3 cloves')),
    recipe(2, 'B', ing('Garlic Clove', '2')),
    recipe(3, 'C', ing('Garlic', '1 clove peeled crushed')),
  ], aisle);
  const garlic = find(items, 'garlic');
  assert.deepEqual(amountLines(garlic, 'us'), ['6 cloves']);
});

test('no measure shows which recipe needs it; vague measures keep their words', () => {
  const items = combine([
    recipe(1, 'Pavlova', ing('Blackberries', '')),
    recipe(2, 'Pesto pasta', ing('Basil', 'small pack')),
  ], aisle);
  const blackberries = find(items, 'blackberry');
  assert.deepEqual(amountLines(blackberries, 'us'), []);
  assert.deepEqual(blackberries.notes, [{ text: '', recipe: 'Pavlova' }]);
  assert.deepEqual(find(items, 'basil').notes, [{ text: 'small pack', recipe: 'Pesto pasta' }]);
});

test('no mixed-unit strings anywhere: every line is one unit', () => {
  const items = combine([
    recipe(1, 'A', ing('Milk', '200ml'), ing('Flour', '200g'), ing('Butter', '2 tbsp')),
    recipe(2, 'B', ing('Milk', '1 cup'), ing('Flour', '1 cup'), ing('Butter', '50g')),
  ], aisle);
  for (const item of items) for (const line of amountLines(item, 'us')) assert.ok(!line.includes('+'), line);
  assert.deepEqual(amountLines(find(items, 'milk'), 'us'), ['1 3/4 cups']);
  assert.deepEqual(amountLines(find(items, 'flour'), 'us'), ['7 oz', '1 cup']);
});

test('staples are flagged, ice is skipped, keys are US singular names', () => {
  const items = combine([recipe(1, 'A', ing('Salt', 'pinch'), ing('Olive Oil', '2 tbsp'), ing('Water', '1 cup'), ing('Ice', 'handful'), ing('Aubergine', '2'))], aisle);
  assert.ok(find(items, 'salt').staple);
  assert.ok(find(items, 'olive oil').staple);
  assert.ok(find(items, 'water').staple);
  assert.equal(items.find(i => i.key === 'ice'), undefined);
  assert.equal(find(items, 'eggplant').name, 'Eggplant');
  assert.equal(itemKey('Cherry Tomatoes'), 'cherry tomato');
});

test('copied text leaves out ticked items and staples', () => {
  const items = combine([recipe(1, 'A', ing('Onion', '2'), ing('Salt', 'pinch'), ing('Carrots', '3'))], aisle);
  const text = listText(items, [{ key: 'custom:1', name: 'Paper towels' }], new Set(['carrot']), 'us');
  assert.match(text, /Onion, 2 whole/);
  assert.doesNotMatch(text, /Carrot|Salt/);
  assert.match(text, /Paper towels/);
});

test('prep words merge into the plain item; canned tomatoes stay separate', () => {
  const items = combine([
    recipe(1, 'A', ing('Chopped Onion', '1 cup'), ing('Chopped Tomatoes', '400g')),
    recipe(2, 'B', ing('Onion', '1'), ing('Tomatoes', '2')),
  ], aisle);
  const onion = find(items, 'onion');
  assert.equal(onion.name, 'Onion');
  assert.equal(new Set(onion.meals).size, 2);
  assert.ok(find(items, 'chopped tomato'));
  assert.ok(find(items, 'tomato'));
});
