import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TG Bridge',
    short_name: 'TG Bridge',
    description: 'Общение с близкими через Telegram в формате web app',
    start_url: '/',
    display: 'standalone',
    background_color: '#d7e3ec',
    theme_color: '#37AEE2',
    lang: 'ru',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
