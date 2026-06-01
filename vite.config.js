import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true,
    allowedHosts: true,
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/news')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            const country = urlObj.searchParams.get('country') || 'US';
            const countryCode = country.toUpperCase();
            
            let rssUrl = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';
            if (countryCode === 'IN') {
                rssUrl = 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en';
            } else if (countryCode === 'GB') {
                rssUrl = 'https://news.google.com/rss?hl=en-GB&gl=GB&ceid=GB:en';
            } else if (countryCode === 'DE') {
                rssUrl = 'https://news.google.com/rss?hl=en-DE&gl=DE&ceid=DE:en';
            } else if (countryCode === 'JP') {
                rssUrl = 'https://news.google.com/rss?hl=en-JP&gl=JP&ceid=JP:en';
            }

            const https = await import('https');
            const xmlData = await new Promise((resolve, reject) => {
                https.get(rssUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 UnifyApp'
                    }
                }, (response) => {
                    let data = '';
                    response.on('data', (chunk) => { data += chunk; });
                    response.on('end', () => resolve(data));
                }).on('error', reject);
            });

            const items = [];
            const itemRegex = /<item>([\s\S]*?)<\/item>/g;
            const titleRegex = /<title>([\s\S]*?)<\/title>/i;
            const linkRegex = /<link>([\s\S]*?)<\/link>/i;
            const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/i;
            const sourceRegex = /<source[^>]*>([\s\S]*?)<\/source>/i;
            
            const cleanXml = (str) => {
                if (!str) return '';
                return str
                    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&apos;/g, "'")
                    .trim();
            };

            let match;
            while ((match = itemRegex.exec(xmlData)) !== null && items.length < 6) {
                const itemContent = match[1];
                const titleMatch = itemContent.match(titleRegex);
                const linkMatch = itemContent.match(linkRegex);
                const pubDateMatch = itemContent.match(pubDateRegex);
                const sourceMatch = itemContent.match(sourceRegex);

                if (titleMatch && linkMatch) {
                    const rawTitle = cleanXml(titleMatch[1]);
                    const link = cleanXml(linkMatch[1]);
                    const pubDate = pubDateMatch ? cleanXml(pubDateMatch[1]) : new Date().toUTCString();
                    const source = sourceMatch ? cleanXml(sourceMatch[1]) : 'Google News';

                    const pubDateObj = new Date(pubDate);
                    // Only include news under 48 hours to guarantee absolute daily freshness
                    if (!isNaN(pubDateObj.getTime()) && (Date.now() - pubDateObj.getTime() > 172800000)) {
                        continue;
                    }

                    const titleParts = rawTitle.split(' - ');
                    let title = rawTitle;
                    if (titleParts.length > 1) {
                        title = titleParts.slice(0, -1).join(' - ');
                    }

                    let category = 'Top Story';
                    const lowerTitle = title.toLowerCase();
                    if (lowerTitle.includes('covid') || lowerTitle.includes('health')) category = 'Health';
                    else if (lowerTitle.includes('market') || lowerTitle.includes('economy')) category = 'Economy';
                    else if (lowerTitle.includes('tech') || lowerTitle.includes('ai')) category = 'Technology';
                    else if (lowerTitle.includes('sport') || lowerTitle.includes('cup')) category = 'Sports';
                    else if (lowerTitle.includes('movie') || lowerTitle.includes('show')) category = 'Entertainment';
                    else if (lowerTitle.includes('weather') || lowerTitle.includes('rain')) category = 'Weather';
                    else if (lowerTitle.includes('protest') || lowerTitle.includes('elect')) category = 'Politics';

                    items.push({
                        id: 'news_' + Math.random().toString(36).substr(2, 9),
                        title,
                        source,
                        date: pubDate, // Pass original date so the client can format it relative to client timezone
                        link,
                        category,
                        isLocalForCountry: true
                    });
                }
            }

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(items));
          } catch (e) {
            console.error('[Vite Serverless Dev Proxy] Error fetching news:', e);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to retrieve news feed', details: e.message }));
          }
        } else {
          next();
        }
      });
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'UNIFY',
        short_name: 'UNIFY',
        description: 'Family companion for health, finance, and community.',
        theme_color: '#0F1218',
        background_color: '#0F1218',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
