// ESM Loader for @shared/* path resolution in Vercel
// This file must be in the root directory

export async function resolve(specifier, context, nextResolve) {
  // Handle @shared/* imports
  if (specifier.startsWith('@shared/')) {
    // Resolve to actual file path
    const path = specifier.replace('@shared/', './shared/');
    // Add .js extension if not present
    const resolvedPath = path.endsWith('.js') ? path : `${path}.js`;
    
    // Use the parent URL to resolve relative to project root
    const parentURL = context.parentURL || import.meta.url;
    const baseURL = new URL('.', parentURL);
    const resolvedURL = new URL(resolvedPath, baseURL);
    
    return nextResolve(resolvedURL.href, context);
  }
  
  // For all other imports, use default resolution
  return nextResolve(specifier, context);
}

