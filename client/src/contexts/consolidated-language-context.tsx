import * as React from 'react';

type Lang = 'tr' | 'en';

const Ctx = React.createContext<{ language: Lang; t: (s: string) => string }>({
  language: 'tr',
  t: (s) => s,
});

export function useLanguage() {
  return React.useContext(Ctx);
}

export function ConsolidatedLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = React.useState<Lang>('tr');
  const t = React.useCallback((s: string) => s, []);
  return <Ctx.Provider value={{ language, t }}>{children}</Ctx.Provider>;
}
