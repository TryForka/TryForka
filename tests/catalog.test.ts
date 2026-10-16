// Unit tests for the recipe-catalog helpers (run with `npm test`).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertTextUnits, formatMeasure, parseMeasure, formatNumber } from '../supabase/functions/_shared/catalog/units.ts';
import { stepTimers, splitSteps } from '../supabase/functions/_shared/catalog/steps.ts';
import { usIngredientName, usKitchenText } from '../supabase/functions/_shared/catalog/names.ts';
import { classifyRecipe, ingredientAllergens } from '../supabase/functions/_shared/catalog/allergens.ts';

const us = (raw: string, x = 1) => formatMeasure(parseMeasure(raw), 'us', x);
const metric = (raw: string, x = 1) => formatMeasure(parseMeasure(raw), 'metric', x);

test('measures: parse common TheMealDB forms', () => {
  assert.deepEqual(parseMeasure('900g'), { quantity: 900, quantityMax: null, unit: 'g', note: '' });
  assert.deepEqual(parseMeasure('3 tablespoons'), { quantity: 3, quantityMax: null, unit: 'tbsp', note: '' });
  assert.deepEqual(parseMeasure('1 1/2 cups'), { quantity: 1.5, quantityMax: null, unit: 'cup', note: '' });
  assert.deepEqual(parseMeasure('½ tsp'), { quantity: 0.5, quantityMax: null, unit: 'tsp', note: '' });
  assert.deepEqual(parseMeasure('1-2 tbs chopped'), { quantity: 1, quantityMax: 2, unit: 'tbsp', note: 'chopped' });
  assert.deepEqual(parseMeasure('2 x 400g tins'), { quantity: 2, quantityMax: null, unit: 'can', note: '(400g)' });
  assert.deepEqual(parseMeasure('3 cloves minced'), { quantity: 3, quantityMax: null, unit: 'clove', note: 'minced' });
  assert.deepEqual(parseMeasure('1 chopped'), { quantity: 1, quantityMax: null, unit: '', note: 'chopped' });
  assert.equal(parseMeasure('to taste').quantity, null);
  assert.equal(parseMeasure('Juice of 1').quantity, null);
  assert.equal(parseMeasure('50ml/2fl oz').unit, 'ml');
  assert.equal(parseMeasure('8-ounce sliced').unit, 'oz');
});

test('measures: US display converts metric with sensible rounding', () => {
  assert.equal(us('900g'), '2 lb');
  assert.equal(us('200g'), '7 oz');
  assert.equal(us('500ml'), '2 cups');
  assert.equal(us('250ml'), '1 cup');
  assert.equal(us('15ml'), '1 tbsp');
  assert.equal(us('3 tablespoons'), '3 tbsp');
  assert.equal(us('1 chopped'), '1 chopped');
  assert.equal(us('to taste'), 'to taste');
  assert.equal(us('2 x 400g tins'), '2 cans (14 oz)');
  assert.equal(metric('1 lb'), '455 g');
  assert.equal(metric('900g'), '900 g');
});

test('measures: scaling handles fractions, unicode and mixed numbers', () => {
  assert.equal(us('1/2 cup', 2), '1 cup');
  assert.equal(us('½ tsp', 3), '1 1/2 tsp');
  assert.equal(us('1 1/2 cups', 2), '3 cups');
  assert.equal(us('3 eggs', 2), '6 eggs');
  assert.equal(us('1-2 tbsp', 2), '2-4 tbsp');
  assert.equal(us('pinch', 3), 'pinch');
  assert.equal(formatNumber(0.333), '1/3');
});

test('text: temperatures become one Fahrenheit value', () => {
  assert.equal(convertTextUnits('Heat the air fryer to 200C.', 'us'), 'Heat the air fryer to 400°F.');
  assert.equal(convertTextUnits('Heat oven to 180C/160C fan/gas 4 and line', 'us'), 'Heat oven to 350°F and line');
  assert.equal(convertTextUnits('Heat oven to 200C/fan 180C/gas 6, then roast', 'us'), 'Heat oven to 400°F, then roast');
  assert.equal(convertTextUnits('bake at 180°C (350°F) for 12-15 minutes', 'us'), 'bake at 350°F for 12-15 minutes');
  assert.equal(convertTextUnits('Preheat oven to 450 degrees F (230 degrees C).', 'us'), 'Preheat oven to 450°F.');
  assert.equal(convertTextUnits('Heat the oven to gas mark 6.', 'us'), 'Heat the oven to 400°F.');
  assert.equal(convertTextUnits('heat oil to 350 degrees', 'us'), 'heat oil to 350 degrees');
  assert.equal(convertTextUnits('Heat oven to 425F.', 'metric'), 'Heat oven to 220°C.');
});

test('text: inline weights, volumes and lengths', () => {
  assert.equal(convertTextUnits('Add 900g potatoes cut into 2cm cubes', 'us'), 'Add 2 lb potatoes cut into 3/4 inch cubes');
  assert.equal(convertTextUnits('pour 500ml hot water', 'us'), 'pour 2 cups hot water');
  assert.equal(convertTextUnits('use 200g/7oz flour', 'us'), 'use 7 oz flour');
});

test('names: British to US', () => {
  assert.equal(usIngredientName('Aubergine'), 'Eggplant');
  assert.equal(usIngredientName('Tomato Puree'), 'Tomato paste');
  assert.equal(usIngredientName('Spring Onions'), 'Green onions');
  assert.equal(usIngredientName('Plain Flour'), 'All-purpose flour');
  assert.equal(usIngredientName('Double Cream'), 'Heavy cream');
  assert.equal(usIngredientName('Minced Beef'), 'Ground beef');
  assert.equal(usIngredientName('Coriander', 'handful'), 'Cilantro');
  assert.equal(usIngredientName('Coriander', '1 tsp'), 'Ground coriander');
  assert.equal(usIngredientName('Chickpeas'), 'Chickpeas');
  assert.equal(usKitchenText('Stir in the tomato purée and chopped coriander, then line a baking tin with baking paper.'),
    'Stir in the tomato paste and chopped cilantro, then line a baking pan with parchment paper.');
  assert.equal(usKitchenText('Add the ground coriander.'), 'Add the ground coriander.');
});

test('steps: split and strip labels', () => {
  assert.deepEqual(splitSteps('STEP 1\r\nSoak the potatoes.\r\n\r\nSTEP 2\r\n2. Drain them.'), ['Soak the potatoes.', 'Drain them.']);
});

test('timers: every duration, labelled from context', () => {
  const t = stepTimers('Soak the potatoes in just-boiled water for 30 mins, then drain and leave to air-dry for 5 mins. Heat the air fryer to 200C.');
  assert.deepEqual(t.map(x => [x.label, x.seconds]), [['Soak 30 min', 1800], ['Dry 5 min', 300]]);
  const range = stepTimers('cook for 20-30 mins until crisp');
  assert.deepEqual(range.map(x => [x.label, x.seconds, x.maxSeconds]), [['Cook 20-30 min', 1200, 1800]]);
  assert.deepEqual(stepTimers('Simmer for 1 1/2 hours.').map(x => x.seconds), [5400]);
  assert.deepEqual(stepTimers('Fry for 30 seconds.').map(x => x.label), ['Fry 30 sec']);
  assert.deepEqual(stepTimers('Bake for 1 hour.').map(x => x.label), ['Bake 1 hr']);
  assert.deepEqual(stepTimers('Leave overnight until golden.'), []);
  assert.deepEqual(stepTimers('After 20 minutes, drain the pearls.'), []);
});

test('allergens: ingredient and recipe level', () => {
  assert.deepEqual(ingredientAllergens('Peanut Butter'), ['peanut']);
  assert.deepEqual(ingredientAllergens('Coconut Milk'), []);
  assert.deepEqual(ingredientAllergens('Water Chestnuts'), []);
  assert.deepEqual(ingredientAllergens('Soy Sauce'), ['gluten', 'soy']);
  const egg = classifyRecipe({ name: 'Egg Drop Soup', category: 'Side', ingredientNames: ['Chicken Stock'] });
  assert.ok(egg.allergens.includes('egg'));
  assert.deepEqual(egg.diets, []);
  const veg = classifyRecipe({ name: 'Bean salad', category: 'Vegetarian', ingredientNames: ['Kidney Beans', 'Olive Oil'] });
  assert.deepEqual(veg.diets, ['pescatarian', 'vegetarian', 'vegan']);
});

test('names: ingredient names in sentence case, proper nouns kept', async () => {
  const { sentenceCaseName } = await import('../supabase/functions/_shared/catalog/names.ts');
  assert.equal(sentenceCaseName('Olive Oil'), 'Olive oil');
  assert.equal(sentenceCaseName('Parmesan Cheese'), 'Parmesan cheese');
  assert.equal(sentenceCaseName('Greek Yogurt'), 'Greek yogurt');
  assert.equal(sentenceCaseName('Grated Parmesan'), 'Grated Parmesan');
  assert.equal(sentenceCaseName('BBQ Sauce'), 'BBQ sauce');
  assert.deepEqual(stepTimers('Griddle for about 3-4 mins on each side').map(t => t.label), ['Griddle 3-4 min']);
});

test('text: imperial/metric pairs in either order keep the imperial half', () => {
  assert.equal(convertTextUnits('Dust a 2lb/900g loaf pan.', 'us'), 'Dust a 2 lb loaf pan.');
  assert.equal(convertTextUnits('4 oz/125g butter', 'us'), '4 oz butter');
  assert.equal(convertTextUnits('1 medium 16floz/500ml tin', 'us'), '1 medium 16 fl oz tin');
  assert.equal(convertTextUnits('about 50-55 g/ 1.7-1.9 oz portions, 7-10 cm/ 3-4 inches long', 'us'), 'about 1.7-1.9 oz portions, 3-4 inches long');
});

test('allergens: misses found by the 2026-10-16 audit', () => {
  assert.ok(ingredientAllergens('Fromage Frais').includes('dairy'));
  assert.ok(ingredientAllergens('Smoky aïoli').includes('egg'));
  assert.ok(ingredientAllergens('Custard').includes('egg'));
  assert.ok(!ingredientAllergens('Custard powder').includes('egg'));
  assert.ok(ingredientAllergens('Oatmeal').includes('gluten'));
  assert.ok(ingredientAllergens('Toast').includes('gluten'));
  assert.ok(ingredientAllergens('Shaoxing Wine').includes('gluten'));
  assert.ok(ingredientAllergens('Black Pudding').includes('gluten'));
  assert.ok(ingredientAllergens('Fermented Black Beans').includes('soy'));
  assert.ok(ingredientAllergens('Prahok').includes('fish'));
  assert.ok(ingredientAllergens('Thai Green Curry Paste').includes('shellfish'));
  assert.ok(!ingredientAllergens('Madras Paste').includes('shellfish'));
  assert.ok(ingredientAllergens('Nougatine').includes('tree_nut'));
  assert.ok(!ingredientAllergens('Glutinous Rice').includes('gluten'));
  assert.ok(!ingredientAllergens('Coconut Milk').includes('dairy'));
});
