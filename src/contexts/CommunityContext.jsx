import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from './LocationContext';

const CommunityContext = createContext();

export const useCommunity = () => useContext(CommunityContext);

export const CommunityProvider = ({ children }) => {
    const { location } = useLocation();
    const [communityState, setCommunityState] = useState({
        weather: null, // { tempF, tempC, condition, code, wind ... }
        aqi: null,
        uv: null,
        alertsCount: 0,
        currentAdvice: 'Loading...'
    });

    // Persistent Unit Preference
    const [unit, setUnit] = useState(() => localStorage.getItem('weatherUnit') || 'F');

    const toggleUnit = () => {
        setUnit(prev => {
            const next = prev === 'F' ? 'C' : 'F';
            localStorage.setItem('weatherUnit', next);
            return next;
        });
    };

    // --- Weather Fetch Logic (Lifted from CommunityDashboard) ---
    useEffect(() => {
        if (location.lat && location.lon) {
            const fetchWeatherData = async () => {
                try {
                    // 1. Weather + UV
                    const weatherRes = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=uv_index_max&temperature_unit=fahrenheit&wind_speed_unit=mph`
                    );
                    const weatherData = await weatherRes.json();

                    let newWeather = null;
                    let newUv = null;

                    if (weatherData.current) {
                        const tF = weatherData.current.temperature_2m;
                        newWeather = {
                            tempF: tF,
                            tempC: (tF - 32) * (5 / 9), // Calculate C derived from F
                            wind: weatherData.current.wind_speed_10m,
                            humidity: weatherData.current.relative_humidity_2m,
                            code: weatherData.current.weather_code,
                        };
                        if (weatherData.daily && weatherData.daily.uv_index_max) {
                            newUv = weatherData.daily.uv_index_max[0];
                        }
                    }

                    // 2. AQI
                    const aqiRes = await fetch(
                        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.lat}&longitude=${location.lon}&current=us_aqi`
                    );
                    const aqiData = await aqiRes.json();
                    const newAqi = aqiData.current ? aqiData.current.us_aqi : null;

                    // 3. Generate Advice
                    let advice = "Enjoy your day! 🌟";
                    if (newWeather) {
                        if (newWeather.code >= 61) advice = "Take an umbrella ☔";
                        else if (newAqi > 150) advice = "Wear a mask 😷";
                        else if (newUv > 8) advice = "Wear sunscreen 🧴";
                        else if (newWeather.tempF > 90) advice = "Stay hydrated 💧";
                        else advice = "Great time to be outside! 🏃";
                    }

                    setCommunityState(prev => ({
                        ...prev,
                        weather: newWeather,
                        aqi: newAqi,
                        uv: newUv,
                        currentAdvice: advice
                    }));

                } catch (err) {
                    console.error("Global Weather Sync Error:", err);
                }
            };
            fetchWeatherData();
        }
    }, [location.lat, location.lon]);

    return (
        <CommunityContext.Provider value={{ communityState, unit, toggleUnit }}>
            {children}
        </CommunityContext.Provider>
    );
};
