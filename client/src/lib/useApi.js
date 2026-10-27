import { useCallback, useEffect, useState } from "react";

/**
 * Runs an API call when the component mounts (and whenever `deps`
 * change) and tracks its loading / error / data state.
 *
 *   const { data, loading, error, reload } = useApi(() => api.getStats(), []);
 *
 * @param {() => Promise<any>} fetcher
 * @param {Array} deps
 */
export function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, reload, setData: (data) => setState((prev) => ({ ...prev, data })) };
}
