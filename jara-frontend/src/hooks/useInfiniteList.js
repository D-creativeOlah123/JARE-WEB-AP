import { useCallback, useEffect, useState } from 'react';

/**
 * useInfiniteList — thin paginator around a `fetchPage({ cursor })` call.
 *
 * The caller supplies a function that returns `{ items, nextCursor }`
 * for a given cursor; the hook stitches pages together.
 *
 *   const { items, loading, loadMore, hasMore, error, reset } =
 *     useInfiniteList(({ cursor }) => listThings({ cursor, limit: 30 }));
 */
export function useInfiniteList(fetchPage) {
  const [items,  setItems]  = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true); setError('');
    try {
      const page = await fetchPage({ cursor });
      setItems((prev) => prev.concat(page.items || []));
      setCursor(page.nextCursor ?? null);
      setHasMore(Boolean(page.nextCursor));
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Could not load more');
    } finally {
      setLoading(false);
    }
  }, [fetchPage, cursor, loading, hasMore]);

  const reset = useCallback(() => {
    setItems([]); setCursor(null); setHasMore(true); setError('');
  }, []);

  // Load the first page on mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMore();
    // Only on mount — subsequent loads happen via loadMore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, loading, loadMore, hasMore, error, reset };
}
