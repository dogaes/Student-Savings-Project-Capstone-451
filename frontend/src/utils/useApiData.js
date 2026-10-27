import { useCallback, useEffect, useState } from 'react'
import { api } from '../auth/api.js'

/** Loads `path` from the API. Returns { data, loading, error, reload }. */
export function useApiData(path) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const reload = useCallback(() => {
    setLoading(true)
    setError(false)
    return api(path)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [path])

  useEffect(() => { reload() }, [reload])

  return { data, loading, error, reload }
}

/** Turns a number input's text into a number, or '' if it's empty. */
export const toNumber = (v) => (v === '' || v === null || v === undefined ? '' : Number(v))
