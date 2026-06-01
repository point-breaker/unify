import { getGenerativeModel } from 'firebase/ai';
import { ai } from '../../firebase';

/**
 * Generates procedure-based fallback local events for a given city and country.
 * Used when the AI service is disconnected or the API is not yet provisioned.
 * 
 * @param {string} city - Geolocated city name.
 * @param {string} country - Geolocated country code.
 * @returns {object[]} Local procedural events.
 */
function getProceduralFallbackEvents(city, country) {
    const today = new Date();
    
    // Procedure helpers to calculate dynamic offsets
    const getFormattedOffsetDate = (daysAhead) => {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysAhead);
        return targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const localNewspaper = country === 'IN' ? 'Malayala Manorama' : 'Local Chronicle';

    return [
        {
            id: 'evt_fallback_1',
            title: `${city} Green Canopy & Tree Planting Initiative`,
            newspaperSource: localNewspaper,
            date: getFormattedOffsetDate(1),
            location: `Central Park Ground, ${city}`,
            link: 'https://www.nature.org'
        },
        {
            id: 'evt_fallback_2',
            title: `${city} Tech Meetup & Next-Gen AI Roundtable`,
            newspaperSource: 'Vanguard Hub',
            date: getFormattedOffsetDate(3),
            location: `Grand Co-Working Conference Room, ${city}`,
            link: 'https://meetup.com'
        },
        {
            id: 'evt_fallback_3',
            title: `${city} Monsoon Agri & Organic Farmers Market`,
            newspaperSource: country === 'IN' ? 'Mathrubhumi' : 'Agricultural Herald',
            date: getFormattedOffsetDate(4),
            location: `Municipal Exhibition Grounds, ${city}`,
            link: 'https://www.usda.gov'
        },
        {
            id: 'evt_fallback_4',
            title: `Clean Air & Smart City Bicycle Campaign`,
            newspaperSource: 'Citizen League',
            date: getFormattedOffsetDate(6),
            location: `Town Hall Square, ${city}`,
            link: 'https://www.cleanair.org'
        }
    ];
}

/**
 * Dynamically generates up-to-date and localized events using Google's Gemini Flash.
 * 
 * @param {string} city - Geolocated city.
 * @param {string} country - Geolocated country.
 * @returns {Promise<object[]>} Array of custom events.
 */
export async function generateLocalEvents(city, country) {
    const cityName = city || 'My City';
    const countryName = country || 'US';
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    try {
        console.log(`[AI Event Generator] Requesting synthesized local events for: ${cityName}, ${countryName} on ${todayStr}`);

        // 1. Initialize Gemini Flash model with JSON output configuration
        const model = getGenerativeModel(ai, {
            model: 'gemini-flash-latest',
            generationConfig: {
                responseMimeType: 'application/json'
            }
        });

        // 2. Draft the context prompt
        const prompt = `You are a local community coordinator for Unify, a high-end personal dashboard.
Synthesize 4 highly realistic, engaging, and beautiful local events, meetups, art expos, start-up conventions, climate summits, or community campaigns taking place in or near the city of ${cityName}, ${countryName} starting today (${todayStr}) or within the next 7 days.

Return a JSON array of event objects matching this exact schema:
[
  {
    "id": "string (unique url-safe id, e.g. 'kochi-art-expo')",
    "title": "string (engaging name of the event customized to ${cityName})",
    "newspaperSource": "string (a local newspaper source or host organization appropriate for ${cityName})",
    "date": "string (e.g. June 2, 2026 or similar formatted date)",
    "location": "string (a realistic local landmark, park, coworking hub, or address in ${cityName})",
    "link": "string (a high-quality relevant website or placeholder url like https://meetup.com)"
  }
]

Rules:
1. Make sure every single event title is unique and directly mentions or refers to landmarks/vibe of ${cityName}.
2. Ensure dates are strictly equal to or after today's date (${todayStr}).
3. newspaperSource should feel authentic (e.g. for Indian cities like Kochi, use names like 'Mathrubhumi', 'Malayala Manorama', or 'Times of India').
4. The response MUST be pure, valid JSON matching the array schema, with absolutely no markdown wrapping.`;

        // 3. Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("[AI Event Generator] Raw model response:", text);

        // 4. Parse the array and validate
        const events = JSON.parse(text);
        if (Array.isArray(events) && events.length > 0) {
            // Apply unique fallbacks if missing
            return events.map((evt, idx) => ({
                id: evt.id || `evt_ai_${Date.now()}_${idx}`,
                title: evt.title || `Local Hub Gathering`,
                newspaperSource: evt.newspaperSource || `Citizen Council`,
                date: evt.date || todayStr,
                location: evt.location || `Municipal Town Hall, ${cityName}`,
                link: evt.link || `https://meetup.com`
            }));
        }

        throw new Error("Parsed response was not a valid events array");

    } catch (error) {
        console.warn("[AI Event Generator] Service connection not provisioned or failed. Loading procedurally generated fallback local events.", error.message);
        // Fallback to high-quality procedural local calendar generator
        return getProceduralFallbackEvents(cityName, countryName);
    }
}
