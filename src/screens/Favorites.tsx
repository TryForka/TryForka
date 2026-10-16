import { useEffect, useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useApp } from '../app/AppContext';
import { supabase } from '../lib/supabase';
import { getCards, type RecipeCard } from '../lib/catalog';
import { Button, cx, EmptyState, ListRow, PageContainer, RecipeTile, Skeleton } from '../components/ds';
import { fetchCollections, recipeCount, type CollectionRow } from '../lib/collections';

// Favorites and Collections. Collections open to their recipes.

type Tab = 'favorites' | 'collections';

function TileGrid({ ids, emptyText }: { ids: number[]; emptyText: React.ReactNode }) {
  const { go, favorites, toggleFavorite } = useApp();
  const [cards, setCards] = useState<Map<number, RecipeCard> | null>(null);
  const key = ids.join(',');
  useEffect(() => {
    let cancelled = false;
    getCards(ids).then(m => { if (!cancelled) setCards(m); }).catch(() => { if (!cancelled) setCards(new Map()); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ids are keyed by `key`
  }, [key]);
  if (!ids.length) return <>{emptyText}</>;
  if (!cards) {
    return (
      <div aria-hidden className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        {ids.slice(0, 8).map(i => <div key={i}><Skeleton className="aspect-square" /><Skeleton className="mt-2 h-4 w-3/4" /></div>)}
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      {ids.map(id => cards.get(id)).filter((c): c is RecipeCard => !!c).map(r => (
        <li key={r.id}>
          <RecipeTile
            recipe={r}
            onOpen={() => go({ name: 'recipe', id: r.id })}
            favorite={favorites.has(r.id)}
            onFavorite={() => toggleFavorite({ id: r.id, title: r.display_name || r.name, image: r.thumb_url ?? '' })}
          />
        </li>
      ))}
    </ul>
  );
}

export function Favorites() {
  const { userId, favorites, go } = useApp();
  const [tab, setTab] = useState<Tab>('favorites');
  const [collections, setCollections] = useState<CollectionRow[] | null>(null);
  const [openCollection, setOpenCollection] = useState<CollectionRow | null>(null);
  const [collectionIds, setCollectionIds] = useState<number[] | null>(null);
  // Keep un-hearted recipes on screen until the user leaves, so a mis-tap can be undone.
  const [shownIds] = useState(() => [...favorites.keys()]);
  const favoriteIds = useMemo(() => [...new Set([...shownIds, ...favorites.keys()])], [shownIds, favorites]);

  useEffect(() => {
    if (tab === 'collections') fetchCollections(userId).then(setCollections).catch(() => setCollections([]));
  }, [tab, userId]);

  useEffect(() => {
    if (!openCollection) return;
    setCollectionIds(null);
    supabase.from('collection_recipes').select('recipe_id').eq('collection_id', openCollection.id).order('added_at', { ascending: false })
      .then(({ data }) => setCollectionIds((data ?? []).map(r => r.recipe_id as number)));
  }, [openCollection]);

  const browse = <Button variant="secondary" icon={BookOpen} onClick={() => go({ name: 'browse' })}>Browse recipes</Button>;

  if (openCollection) {
    return (
      <PageContainer title={openCollection.name} onBack={() => setOpenCollection(null)} backLabel="Back to collections"
        intro={collectionIds ? recipeCount(collectionIds.length) : undefined}>
        {collectionIds === null ? <Skeleton className="aspect-square w-40" /> : (
          <TileGrid ids={collectionIds} emptyText={<EmptyState title="Nothing in this collection yet" action={browse}>Open a recipe, tap the three dots, then Add to collection.</EmptyState>} />
        )}
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Favorites">
      <div role="tablist" aria-label="Favorites" className="mb-6 flex gap-6 border-b border-line">
        {(['favorites', 'collections'] as const).map(t => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cx('-mb-px cursor-pointer border-b-2 pb-3 text-base font-semibold transition-colors duration-150',
              tab === t ? 'border-basil text-ink' : 'border-transparent text-ink-muted hover:text-ink')}
          >
            {t === 'favorites' ? 'Favorites' : 'Collections'}
          </button>
        ))}
      </div>

      {tab === 'favorites' ? (
        <TileGrid ids={favoriteIds} emptyText={<EmptyState title="No favorites yet" action={browse}>Recipes you heart show up here.</EmptyState>} />
      ) : collections === null ? <Skeleton className="h-24 w-full max-w-xl" /> : collections.length === 0 ? (
        <EmptyState title="No collections yet" action={browse}>Group recipes your way, like "Weeknight" or "Kids love it". Open a recipe, tap the three dots, then Add to collection.</EmptyState>
      ) : (
        <div className="max-w-xl border-t border-line">
          {collections.map(c => <ListRow key={c.id} title={c.name} subtitle={recipeCount(c.count)} chevron onClick={() => setOpenCollection(c)} />)}
        </div>
      )}
    </PageContainer>
  );
}
