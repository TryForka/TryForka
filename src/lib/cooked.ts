import { supabase } from './supabase';

// "Mark as cooked" log (cooked_recipes). A recipe shows as cooked if it was marked today.

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };

/** When it was marked cooked today, or null. */
export async function cookedRecently(userId: string, recipeId: number): Promise<string | null> {
  const { data, error } = await supabase.from('cooked_recipes').select('cooked_at')
    .eq('user_id', userId).eq('recipe_id', recipeId).gte('cooked_at', startOfToday())
    .order('cooked_at', { ascending: false }).limit(1);
  if (error) throw new Error(error.message);
  return (data?.[0]?.cooked_at as string) ?? null;
}

export async function markCooked(userId: string, recipeId: number): Promise<string> {
  const { data, error } = await supabase.from('cooked_recipes').insert({ user_id: userId, recipe_id: recipeId }).select('cooked_at').single();
  if (error) throw new Error(error.message);
  return data.cooked_at as string;
}

/** Undo today's mark. */
export async function unmarkCooked(userId: string, recipeId: number): Promise<void> {
  const { error } = await supabase.from('cooked_recipes').delete()
    .eq('user_id', userId).eq('recipe_id', recipeId).gte('cooked_at', startOfToday());
  if (error) throw new Error(error.message);
}
