/**
 * Resolves media/image URLs across local development and production.
 * Handles absolute URLs (e.g. ImgBB, Cloudinary, AWS S3) as well as relative paths (/media/...).
 */
export const getMediaUrl = (url?: string | null): string => {
  if (!url) return '';
  
  // Return as-is if already an absolute HTTP/HTTPS URL, blob, or base64 data
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }

  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (rawBaseUrl) {
    const origin = rawBaseUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${origin}${cleanPath}`;
  }

  // Fallback for local Vite dev server (proxies /media to Django port 8000)
  return url.startsWith('/') ? url : `/${url}`;
};
