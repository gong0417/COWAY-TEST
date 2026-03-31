import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SearchContextValue = {
  query: string;
  setQuery: (q: string) => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQueryState] = useState("");
  const setQuery = useCallback((q: string) => setQueryState(q), []);
  const value = useMemo(() => ({ query, setQuery }), [query, setQuery]);
  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearchQuery() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearchQuery must be used within SearchProvider");
  return ctx;
}
