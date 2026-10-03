import { useCallback, useEffect, useState } from "react";

// Runs a memoised loader and tracks loading/data/error. Pass the loader wrapped in
// useCallback, since it is the effect dependency.
export function useAsync(loader) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(0);

  useEffect(() => {
    let active = true;
    loader()
      .then((result) => active && setData(result))
      .catch((loadError) => active && setError(loadError))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [loader, token]);

  // Called from handlers, never from an effect, so setting state here is fine.
  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setToken((value) => value + 1);
  }, []);

  return { data, error, loading, reload };
}
