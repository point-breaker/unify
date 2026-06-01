import https from 'https';

/**
 * Clean up HTML entities inside RSS strings
 */
function cleanXmlString(str) {
    if (!str) return '';
    return str
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .trim();
}

/**
 * Fetch data from a URL using Node's standard https module
 */
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 UnifyApp'
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(data));
        }).on('error', (err) => reject(err));
    });
}

/**
 * Parses Google News RSS XML using a high-performance regex engine
 */
function parseRssXml(xmlString) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    
    const titleRegex = /<title>([\s\S]*?)<\/title>/i;
    const linkRegex = /<link>([\s\S]*?)<\/link>/i;
    const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/i;
    const sourceRegex = /<source[^>]*>([\s\S]*?)<\/source>/i;

    let match;
    while ((match = itemRegex.exec(xmlString)) !== null && items.length < 6) {
        const itemContent = match[1];
        
        const titleMatch = itemContent.match(titleRegex);
        const linkMatch = itemContent.match(linkRegex);
        const pubDateMatch = itemContent.match(pubDateRegex);
        const sourceMatch = itemContent.match(sourceRegex);

        if (titleMatch && linkMatch) {
            const rawTitle = cleanXmlString(titleMatch[1]);
            const link = cleanXmlString(linkMatch[1]);
            const pubDate = pubDateMatch ? cleanXmlString(pubDateMatch[1]) : new Date().toUTCString();
            const source = sourceMatch ? cleanXmlString(sourceMatch[1]) : 'Google News';

            // Filter out news older than 48 hours to ensure absolute daily freshness
            const pubDateObj = new Date(pubDate);
            if (!isNaN(pubDateObj.getTime())) {
                const diffMs = Date.now() - pubDateObj.getTime();
                if (diffMs > 172800000) { // 48 hours in milliseconds
                    continue; // Discard old news
                }
            }

            // Google News RSS titles append the publisher at the end, e.g. "Headline - Source"
            // We split by " - " and remove the last element to get a clean headline
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

            // Parse pubDate to a premium relative time ago format
            let formattedDate = 'Today';
            try {
                if (!isNaN(pubDateObj.getTime())) {
                    const now = new Date();
                    const diffMs = now.getTime() - pubDateObj.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);

                    if (diffMins < 0) {
                        formattedDate = 'Just now';
                    } else if (diffMins < 60) {
                        formattedDate = `${diffMins}m ago`;
                    } else if (diffHours < 24) {
                        formattedDate = `${diffHours}h ago`;
                    } else if (diffDays === 1) {
                        formattedDate = 'Yesterday';
                    } else if (diffDays < 7) {
                        formattedDate = `${diffDays}d ago`;
                    } else {
                        formattedDate = pubDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }
                }
            } catch {
                formattedDate = 'Today';
            }

            items.push({
                id: 'news_' + Math.random().toString(36).substr(2, 9),
                title,
                source,
                date: formattedDate,
                link,
                category,
                isLocalForCountry: true // Flag indicating it matches user country
            });
        }
    }

    return items;
}

export default async function handler(req, res) {
    // Disable edge/browser caching completely to ensure fresh daily updates
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { country } = req.query;
    const countryCode = (country || 'US').toUpperCase();

    // Map countries to appropriate localized Google News RSS endpoints
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

    try {
        console.log(`[API News] Fetching real-time Google News RSS for country: ${countryCode}`);
        const xmlData = await fetchUrl(rssUrl);
        const articles = parseRssXml(xmlData);
        
        res.status(200).json(articles);
    } catch (error) {
        console.error('[API News] Error fetching news:', error);
        res.status(500).json({ error: 'Failed to retrieve real-time news feed', details: error.message });
    }
}
