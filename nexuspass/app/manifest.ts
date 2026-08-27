import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NEXUSPASS',
    short_name: 'NEXUSPASS',
    description: 'Digital ID Card System',
    start_url: '/',
    display: 'standalone', // Ito yung nag-aalis ng address bar para maging parang app!
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}