import { useCallback, useRef, useState } from "react";

export function usePullRefresh(...callbacks: Array<() => Promise<void>>) {
  const [refreshing, setRefreshing] = useState(false);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all(callbacksRef.current.map((fn) => fn().catch(() => undefined)));
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { refreshing, onRefresh };
}
