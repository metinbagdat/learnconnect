export function useToast() {
  return {
    toast: (opts?: { title?: string; description?: string; variant?: 'default' | 'destructive' }) => {
      if (typeof window !== 'undefined' && opts?.title) console.log('[toast]', opts.title, opts.description);
    },
  };
}
