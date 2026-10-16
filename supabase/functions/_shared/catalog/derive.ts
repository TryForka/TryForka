// TheMealDB meal -> the deterministic columns of a `recipes` row. Pure TypeScript.
// Claude-derived columns (meal_role, display_name, subtitle, total_minutes) are filled
// separately by sync-recipes and never overwritten here.

import { type Allergen, classifyRecipe, type Diet, ingredientAllergens } from './allergens.ts';
import { sentenceCaseName, usIngredientName, usKitchenText } from './names.ts';
import { splitSteps, type StepTimer, stepTimers } from './steps.ts';
import { convertTemperatures, convertTextUnits, parseMeasure } from './units.ts';

export type MealDbMeal = { idMeal: string; strMeal: string } & Record<string, string | null | undefined>;

export interface RecipeIngredient {
  name: string;
  name_us: string;
  measure_raw: string;
  quantity: number | null;
  quantity_max: number | null;
  /** Canonical unit ("g", "tbsp", "clove") or '' for a bare count. */
  unit: string;
  note: string;
  allergens: Allergen[];
}

export interface RecipeStep {
  /** US units and kitchen English: "Heat the oven to 400°F". */
  text_us: string;
  /** Metric units (temperatures in °C) with US ingredient names. */
  text_metric: string;
  timers: StepTimer[];
}

export interface DerivedRecipe {
  id: number;
  name: string;
  category: string | null;
  area: string | null;
  thumb_url: string | null;
  instructions_raw: string | null;
  steps: RecipeStep[];
  ingredients: RecipeIngredient[];
  ingredient_names: string[];
  tags: string[];
  source_url: string | null;
  youtube_url: string | null;
  allergens: Allergen[];
  diets: Diet[];
}

// TheMealDB mixes adjectives ("Spanish") with country names ("France"); use adjectives.
const AREA_ADJECTIVE: Record<string, string> = {
  Argentina: 'Argentinian', France: 'French', India: 'Indian', Netherlands: 'Dutch', Norway: 'Norwegian',
  Slovakia: 'Slovak', 'United States': 'American', Venezuela: 'Venezuelan', Unknown: '',
};

const clean = (v: string | null | undefined) => (v ?? '').replace(/\s+/g, ' ').trim();
const orNull = (v: string | null | undefined) => clean(v) || null;

export function deriveRecipe(meal: MealDbMeal): DerivedRecipe {
  const ingredients: RecipeIngredient[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = clean(meal[`strIngredient${i}`]);
    if (!name) continue;
    const measureRaw = clean(meal[`strMeasure${i}`]);
    const m = parseMeasure(measureRaw);
    const nameUs = usIngredientName(name, measureRaw);
    ingredients.push({
      name,
      name_us: sentenceCaseName(nameUs),
      measure_raw: measureRaw,
      quantity: m.quantity,
      quantity_max: m.quantityMax,
      unit: m.unit,
      note: m.note,
      allergens: [...new Set([...ingredientAllergens(name), ...ingredientAllergens(nameUs)])],
    });
  }
  const steps: RecipeStep[] = splitSteps(meal.strInstructions).map(text => ({
    text_us: usKitchenText(convertTextUnits(text, 'us')),
    text_metric: usKitchenText(convertTemperatures(text, 'metric')),
    timers: stepTimers(text),
  }));
  const ingredientNames = [...new Set(ingredients.flatMap(i => [i.name.toLowerCase(), i.name_us.toLowerCase()]))];
  const category = orNull(meal.strCategory);
  const { allergens, diets } = classifyRecipe({
    name: meal.strMeal,
    category: category ?? '',
    ingredientNames: ingredients.flatMap(i => [i.name, i.name_us]),
    instructions: meal.strInstructions,
  });
  return {
    id: Number(meal.idMeal),
    name: clean(meal.strMeal),
    category,
    area: orNull(AREA_ADJECTIVE[clean(meal.strArea)] ?? meal.strArea),
    thumb_url: orNull(meal.strMealThumb),
    instructions_raw: meal.strInstructions ?? null,
    steps,
    ingredients,
    ingredient_names: ingredientNames,
    tags: clean(meal.strTags).split(',').map(t => t.trim()).filter(Boolean),
    source_url: orNull(meal.strSource),
    youtube_url: orNull(meal.strYoutube),
    allergens,
    diets,
  };
}
