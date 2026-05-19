import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LocationContext = createContext();

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
    const [location, setLocation] = useState({
        city: 'Detecting...',
        region: 'Unknown',
        country: 'US',
        currency: '$',
        currencyCode: 'USD',
    });
    const [loading, setLoading] = useState(true);

    const deriveCurrency = (countryCode) => {
        switch (countryCode) {
            case 'IN': return { symbol: '₹', code: 'INR' };
            case 'GB': return { symbol: '£', code: 'GBP' };
            case 'EU':
            case 'DE':
            case 'FR':
            case 'ES':
            case 'IT': return { symbol: '€', code: 'EUR' };
            case 'JP': return { symbol: '¥', code: 'JPY' };
            default: return { symbol: '$', code: 'USD' };
        }
    };

    const fallbackToTimezone = useCallback(() => {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let country = 'US';

        if (timeZone.includes('Calcutta') || timeZone.includes('Asia/Kolkata')) country = 'IN';
        else if (timeZone.includes('London')) country = 'GB';
        else if (timeZone.includes('Europe')) country = 'DE'; // Generic Euro

        const currency = deriveCurrency(country);

        setLocation({
            city: timeZone.split('/')[1] || 'Local',
            region: 'Timezone Based',
            country,
            currency: currency.symbol,
            currencyCode: currency.code
        });
        setLoading(false);
    }, []);

    const detectLocation = useCallback(async () => {
        setLoading(true);
        // 1. Try Browser Geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        // Reverse Geocode (Using a free API like BigDataCloud or OpenStreetMap)
                        // For robustness without API keys, we'll try OpenStreetMap (Nominatim)
                        const { latitude, longitude } = position.coords;
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await res.json();

                        const country = data.address.country_code.toUpperCase();
                        const currency = deriveCurrency(country);

                        setLocation({
                            city: data.address.city || data.address.town || data.address.village || 'Unknown City',
                            region: data.address.state || 'Unknown Region',
                            country: country,
                            currency: currency.symbol,
                            currencyCode: currency.code,
                            lat: latitude,
                            lon: longitude
                        });
                        setLoading(false);
                    } catch (error) {
                        console.error('Reverse Geocode Error:', error);
                        // Fallback to Timezone guess
                        fallbackToTimezone();
                    }
                },
                (error) => {
                    console.error('Geolocation Error:', error);
                    fallbackToTimezone();
                }
            );
        } else {
            fallbackToTimezone();
        }
    }, [fallbackToTimezone]);

    useEffect(() => {
        Promise.resolve().then(() => detectLocation());
    }, [detectLocation]);

    return (
        <LocationContext.Provider value={{ location, refreshLocation: detectLocation, loading }}>
            {children}
        </LocationContext.Provider>
    );
};
