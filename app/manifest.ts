import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'TG Bridge',
    short_name: 'TG Bridge',
    description: 'Общение с близкими через Telegram в формате web app',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#d7e3ec',
    theme_color: '#37AEE2',
    lang: 'ru',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
