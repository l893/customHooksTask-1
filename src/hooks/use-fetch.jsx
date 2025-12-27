import { useState, useEffect, useCallback, useRef } from 'react';

export const useFetch = (initialUrl) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async (url, params = {}) => {
    // Отменяем предыдущий запрос
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      // Добавляем параметры к URL
      let finalUrl = url;
      if (params && Object.keys(params).length > 0) {
        const urlObj = new URL(url);
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          searchParams.append(key, String(value));
        });

        urlObj.search = searchParams.toString();
        finalUrl = urlObj.toString();
      }

      const response = await fetch(finalUrl, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Произошла ошибка');
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(
    async (options = {}) => {
      await fetchData(initialUrl, options.params);
    },
    [initialUrl, fetchData],
  );

  useEffect(() => {
    fetchData(initialUrl);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [initialUrl, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
};
