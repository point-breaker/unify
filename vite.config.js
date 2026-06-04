import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { Buffer } from 'buffer'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true,
    allowedHosts: true,
  },
  plugins: [
    {
      name: 'api-news-proxy',
      configureServer(server) {
        setTimeout(() => {
          console.log("=== CONNECT MIDDLEWARE STACK ===");
          server.middlewares.stack.forEach((m, i) => {
            console.log(`${i}: route="${m.route}" handle=${m.handle.name || typeof m.handle}`);
          });
          console.log("================================");
        }, 1000);

        server.middlewares.use('/api/news', async (req, res) => {
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
                    const chunks = [];
                    response.on('data', (chunk) => { chunks.push(chunk); });
                    response.on('end', () => {
                        resolve(Buffer.concat(chunks).toString('utf8'));
                    });
                }).on('error', reject);
            });

            const allItems = [];
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
            while ((match = itemRegex.exec(xmlData)) !== null) {
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

                    const titleParts = rawTitle.split(' - ');
                    let title = rawTitle;
                    if (titleParts.length > 1) {
                        title = titleParts.slice(0, -1).join(' - ');
                    }

                    // Generate localized categories based on title keywords
                    let category = 'Local';
                    const lowerTitle = title.toLowerCase();
                    if (lowerTitle.includes('covid') || lowerTitle.includes('health') || lowerTitle.includes('virus')) category = 'Health';
                    else if (lowerTitle.includes('market') || lowerTitle.includes('inflation') || lowerTitle.includes('stocks') || lowerTitle.includes('economy')) category = 'Economy';
                    else if (lowerTitle.includes('tech') || lowerTitle.includes('ai') || lowerTitle.includes('cyber') || lowerTitle.includes('apple') || lowerTitle.includes('google')) category = 'Technology';
                    else if (lowerTitle.includes('sport') || lowerTitle.includes('cricket') || lowerTitle.includes('cup') || lowerTitle.includes('match')) category = 'Sports';
                    else if (lowerTitle.includes('movie') || lowerTitle.includes('show') || lowerTitle.includes('star') || lowerTitle.includes('awards')) category = 'Entertainment';
                    else if (lowerTitle.includes('weather') || lowerTitle.includes('rain') || lowerTitle.includes('monsoon') || lowerTitle.includes('storm')) category = 'Weather';
                    else if (lowerTitle.includes('protest') || lowerTitle.includes('assembly') || lowerTitle.includes('elect') || lowerTitle.includes('minister') || lowerTitle.includes('police')) category = 'Politics';
                    else category = 'Top Story';

                    allItems.push({
                        id: 'news_' + Math.random().toString(36).substr(2, 9),
                        title,
                        source,
                        date: pubDate,
                        link,
                        category,
                        isLocalForCountry: true,
                        pubDateObj: new Date(pubDate)
                    });
                }
            }

            let filteredItems = allItems.filter(item => {
                if (isNaN(item.pubDateObj.getTime())) return true;
                return (Date.now() - item.pubDateObj.getTime()) <= 172800000;
            });

            if (filteredItems.length === 0) {
                filteredItems = allItems;
            }

            const finalItems = filteredItems.slice(0, 6).map(item => {
                const rest = { ...item };
                delete rest.pubDateObj;
                return rest;
            });

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
            res.end(JSON.stringify(finalItems));
          } catch (e) {
            console.error('[Vite Serverless Dev Proxy] Error fetching news:', e);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to retrieve news feed', details: e.message }));
          }
        });

        // Move the registered middleware to the front of the stack
        const proxyMiddleware = server.middlewares.stack.pop();
        server.middlewares.stack.unshift(proxyMiddleware);
      }
    },
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
