import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Lang = 'tr' | 'en';

const Ctx = createContext<{ language: Lang; t: (s: string) => string }>({
  language: 'tr',
  t: (s) => s,
});

export function useLanguage() {
  return useContext(Ctx);
}

export function ConsolidatedLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Lang>('tr');
  const t = useCallback((s: string) => s, []);
  return <Ctx.Provider value={{ language, t }}>{children}</Ctx.Provider>;
}
