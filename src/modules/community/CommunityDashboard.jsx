import React, { useState, useEffect } from 'react';
import { CloudRain, Wind, MapPin, AlertTriangle, Info, Calendar, Users, Sun, Cloud, Thermometer, Droplets, Activity, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import styles from './Community.module.css';
import { useLocation } from '../../contexts/LocationContext';
import { useCommunity } from '../../contexts/CommunityContext';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

const CommunityDashboard = () => {
    const { location, loading } = useLocation();
    const { communityState, unit, toggleUnit } = useCommunity();
    const { weather, aqi, uv, currentAdvice } = communityState;

    // Use Context for Weather Data directly
    // const [weather, setWeather] = useState(null); 
    // const [aqi, setAqi] = useState(null);
    // const [uv, setUv] = useState(null);

    const [alerts, setAlerts] = useState([]);
    
    const { currentUser } = useAuth();
    const [communityStats, setCommunityStats] = useState({
        eventsJoined: 3,
        hoursVolunteered: 12,
        donatedAmount: 50,
        level: 1,
        title: "Local Helper"
    });

    // Fetch and sync user community statistics from Firestore
    useEffect(() => {
        if (!currentUser) return;
        
        const fetchCommunityStats = async () => {
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const data = userDocSnap.data();
                    if (data.community) {
                        setCommunityStats(data.community);
                    } else {
                        // Seed default values if empty
                        await setDoc(userDocRef, {
                            community: {
                                eventsJoined: 3,
                                hoursVolunteered: 12,
                                donatedAmount: 50,
                                level: 1,
                                title: "Local Helper"
                            }
                        }, { merge: true });
                    }
                }
            } catch (err) {
                console.error("Failed to load community statistics:", err);
            }
        };
        fetchCommunityStats();
    }, [currentUser]);

    const updateCommunityStat = async (field, incrementBy) => {
        if (!currentUser) return;
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const newValue = Math.max(0, (communityStats[field] || 0) + incrementBy);
            
            // Dynamic Leveling: 1 level per 8 hours of volunteering + 0.5 points per event + $40 donated
            const tempStats = { ...communityStats, [field]: newValue };
            const newLevel = Math.max(1, Math.floor((tempStats.hoursVolunteered / 8) + (tempStats.eventsJoined * 0.5) + (tempStats.donatedAmount / 40)));
            const titles = ["Local Helper", "Neighborhood Guardian", "Community Pillar", "Regional Champion", "Eco-Ecosystem Hero", "Supreme Local Hero"];
            const newTitle = titles[Math.min(titles.length - 1, Math.floor(newLevel / 2))];
            
            const updated = {
                ...tempStats,
                level: newLevel,
                title: newTitle
            };
            
            setCommunityStats(updated);
            await setDoc(userDocRef, { community: updated }, { merge: true });
        } catch (err) {
            console.error("Failed to update community stat:", err);
        }
    };

    // --- Weather & Health Data Fetching ---
    /* MOVED TO CONTEXT
    useEffect(() => {
        if (location.lat && location.lon) {
            const fetchWeatherData = async () => {
                 // ... logic moved to Context ...
            };
            fetchWeatherData();
        }
    }, [location.lat, location.lon]);
    */

    // --- News / Alerts Fetching with Deduplication ---
    // Helper: Jaccard Similarity
    const getSimilarity = (str1, str2) => {
        const set1 = new Set(str1.toLowerCase().split(' '));
        const set2 = new Set(str2.toLowerCase().split(' '));
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return intersection.size / union.size;
    };

    const timeAgo = (dateStr) => {
        const diff = new Date() - new Date(dateStr);
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return '1d+ ago';
    };

    useEffect(() => {
        if (location.city && location.city !== 'Detecting...') {
            const fetchNews = async () => {
                try {
                    const query = encodeURIComponent(`${location.city} news when:24h`);
                    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
                    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=20`);
                    const data = await res.json();

                    if (data.items) {
                        // Sort Newest First
                        data.items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

                        let uniqueItems = [];
                        data.items.forEach(item => {
                            if (item.title.length < 15) return;
                            const isDuplicate = uniqueItems.some(existing => getSimilarity(item.title, existing.title) > 0.3);
                            if (!isDuplicate) uniqueItems.push(item);
                        });

                        const newsAlerts = uniqueItems.slice(0, 5).map(item => ({
                            type: item.title.toLowerCase().match(/police|storm|alert|warning|fire|emergency/) ? 'critical' : 'info',
                            title: item.title,
                            desc: item.description ? item.description.replace(/<[^>]*>?/gm, '').slice(0, 100) + '...' : 'Click to read coverage.',
                            time: timeAgo(item.pubDate),
                            link: item.link,
                            source: item.author || 'Local News'
                        }));
                        setAlerts(newsAlerts);
                    }
                } catch (err) {
                    console.error("News error:", err);
                    setAlerts([{ type: 'info', title: 'Local Updates Unavailable', desc: 'Could not fetch live news.', time: 'Now', link: '#' }]);
                }
            };
            fetchNews();
        }
    }, [location.city]);

    // --- Helpers ---
    const getTemp = () => {
        if (!weather) return '--';
        return Math.round(unit === 'C' ? weather.tempC : weather.tempF);
    };

    const getAdvice = () => {
        // Use logic now in Context, or fallback to local
        return currentAdvice || "Loading advice...";
    };

    const getAqiStatus = (val) => {
        if (val <= 50) return { label: 'Good', color: '#10B981' };
        if (val <= 100) return { label: 'Moderate', color: '#F59E0B' };
        if (val <= 150) return { label: 'Unhealthy for Sensitive', color: '#F97316' };
        return { label: 'Unhealthy', color: '#EF4444' };
    };

    const uvLevel = (val) => val > 7 ? 'High' : val > 2 ? 'Moderate' : 'Low';

    // --- Render ---
    if (loading) return <div style={{ padding: 20 }}>Detecting location...</div>;

    const aqiStatus = getAqiStatus(aqi || 0);

    const renderWeatherIcon = (code) => {
        if (code === undefined) return <Cloud size={64} color="white" />;
        if (code <= 3) return <Sun size={64} color="#FDB813" />;
        if (code <= 60) return <Cloud size={64} color="#B0C4DE" />;
        return <CloudRain size={64} color="#60A5FA" />;
    };

    // --- Events Fetching Logic ---
    const [events, setEvents] = useState([]);

    useEffect(() => {
        if (location.city && location.city !== 'Detecting...') {
            const fetchEvents = async () => {
                try {
                    // Targeted query for events/things to do
                    const query = encodeURIComponent(`${location.city} upcoming events festival concert community`);
                    // 'when:7d' ensures we only get recent announcements, likely for upcoming events
                    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
                    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=15`);
                    const data = await res.json();

                    if (data.items) {
                        data.items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
                        let uniqueEvents = [];

                        data.items.forEach(item => {
                            // Filter out generic news that might leak in
                            if (!item.title.toLowerCase().match(/event|fest|market|concert|show|meet|drive|fair|expo|run|walk|club/)) return;

                            const isDuplicate = uniqueEvents.some(existing => getSimilarity(item.title, existing.title) > 0.3);
                            if (!isDuplicate) uniqueEvents.push(item);
                        });

                        const realEvents = uniqueEvents.slice(0, 4).map(item => ({
                            title: item.title,
                            date: new Date(item.pubDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
                            time: 'See details', // RSS doesn't give event time
                            location: item.source || location.city, // Use source as proxy for venue if specific location missing
                            link: item.link
                        }));
                        setEvents(realEvents);
                    }
                } catch (err) {
                    console.error("Event fetch failed:", err);
                }
            };
            fetchEvents();
        }
    }, [location.city]);

    // Derived Weather Icon

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <div className={styles.locationBadge}>
                    <MapPin size={16} />
                    <span>{location.city}, {location.region}</span>
                </div>
                <h2 className={styles.title}>Community Pulse</h2>
            </header>

            {/* Advanced Weather Card */}
            <section className={styles.weatherCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
                    <button
                        onClick={toggleUnit}
                        className={styles.unitToggle}
                    >
                        {unit === 'F' ? <ToggleLeft size={24} /> : <ToggleRight size={24} />}
                        <span>°{unit}</span>
                    </button>
                    <div className={styles.adviceBadge}>
                        {getAdvice()}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                    <div className={styles.weatherInfo}>
                        <div className={styles.temp}>
                            {getTemp()}°
                        </div>
                        <div className={styles.condition}>{weather ? (weather.code <= 3 ? 'Clear' : 'Cloudy') : '--'}</div>
                    </div>
                    <div className={styles.weatherIcon}>
                        {renderWeatherIcon(weather?.code)}
                    </div>
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <Wind size={14} color="var(--text-secondary)" />
                            <span>{weather ? weather.wind : '--'} mph</span>
                        </div>
                        <div className={styles.statItem}>
                            <Droplets size={14} color="var(--text-secondary)" />
                            <span>{weather ? weather.humidity : '--'}%</span>
                        </div>
                        <div className={styles.statItem}>
                            <Sun size={14} color="var(--text-secondary)" />
                            <span>UV: {uv || '--'} ({uvLevel(uv)})</span>
                        </div>
                        <div className={styles.statItem}>
                            <Activity size={14} color="var(--text-secondary)" />
                            <span style={{ color: aqiStatus.color }}>AQI: {aqi || '--'} ({aqiStatus.label})</span>
                        </div>
                    </div>
                </div>
            </section>

            <div className={styles.grid}>
                {/* Impact Tracker */}
                <div className={styles.card} style={{ gridColumn: 'span 3', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', color: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(124, 58, 237, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: 20, marginBottom: 4, fontWeight: '800' }}>Your Community Impact</h3>
                            <p style={{ opacity: 0.8, fontSize: 13 }}>Persistent ecosystem activity synced with Firestore</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 28, fontWeight: 800 }}>Level {communityStats.level}</div>
                            <div style={{ fontSize: 12, opacity: 0.8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{communityStats.title}</div>
                        </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 20 }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: 14, borderRadius: 16, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>{communityStats.eventsJoined}</div>
                            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>Events Joined</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: 14, borderRadius: 16, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>{communityStats.hoursVolunteered}h</div>
                            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>Volunteered</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: 14, borderRadius: 16, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>${communityStats.donatedAmount}</div>
                            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>Donated</div>
                        </div>
                    </div>

                    {/* Log actions block */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                        <button 
                            onClick={() => updateCommunityStat('hoursVolunteered', 2)}
                            style={{
                                flex: 1, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                                padding: '10px 14px', borderRadius: '12px', cursor: 'pointer',
                                fontWeight: '700', fontSize: '12px', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}
                        >
                            🕒 Log +2 Hours
                        </button>
                        <button 
                            onClick={() => updateCommunityStat('donatedAmount', 25)}
                            style={{
                                flex: 1, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                                padding: '10px 14px', borderRadius: '12px', cursor: 'pointer',
                                fontWeight: '700', fontSize: '12px', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}
                        >
                            💰 Log +$25 Donation
                        </button>
                    </div>
                </div>

                {/* News Feed */}
                <section className={styles.section}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 className={styles.sectionTitle}>Local News</h3>
                        <span style={{ fontSize: 10, opacity: 0.6 }}>LIVE • {alerts.length} Stories</span>
                    </div>
                    <div className={styles.alertsList}>
                        {alerts.map((alert, idx) => (
                            <div key={idx} className={`${styles.alertItem} ${styles[alert.type]}`}>
                                <div className={styles.alertIcon}>
                                    {alert.type === 'critical' ? <AlertTriangle size={20} /> : <Info size={20} />}
                                </div>
                                <div className={styles.alertContent}>
                                    <a href={alert.link} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                        <h4 style={{ marginBottom: 4 }}>{alert.title}</h4>
                                        <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            {alert.source} • {alert.time}
                                        </div>
                                        <p>{alert.desc}</p>
                                    </a>
                                </div>
                                <ExternalLink size={14} style={{ opacity: 0.5 }} />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Events Feed */}
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Upcoming Events</h3>
                    <div className={styles.eventsList}>
                        {events.length > 0 ? events.map((evt, idx) => (
                            <div key={idx} className={styles.eventItem}>
                                <div className={styles.dateBox} style={{ background: evt.rsvp ? 'var(--success)' : 'var(--bg-card-hover)' }}>
                                    <Calendar size={18} color={evt.rsvp ? 'white' : 'var(--text-secondary)'} />
                                    <span style={{ textAlign: 'center', fontSize: 10, color: evt.rsvp ? 'white' : 'var(--text-secondary)' }}>{evt.date.split(',')[0]}</span>
                                </div>
                                <div className={styles.eventDetails}>
                                    <a href={evt.link} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                        <h4 style={{ cursor: 'pointer' }}>{evt.title}</h4>
                                    </a>
                                    <div className={styles.meta}>
                                        <span>{evt.location}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const newEvents = [...events];
                                        const isGoing = !newEvents[idx].rsvp;
                                        newEvents[idx].rsvp = isGoing;
                                        setEvents(newEvents);
                                        updateCommunityStat('eventsJoined', isGoing ? 1 : -1);
                                    }}
                                    className={styles.joinBtn}
                                    style={{
                                        background: evt.rsvp ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                        color: evt.rsvp ? 'var(--success)' : 'var(--text-secondary)',
                                        border: evt.rsvp ? '1px solid var(--success)' : '1px solid var(--glass-border)',
                                        width: 'auto',
                                        padding: '0 12px',
                                        gap: 6
                                    }}
                                >
                                    {evt.rsvp ? 'Going' : 'RSVP'}
                                </button>
                            </div>
                        )) : (
                            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No specific event announcements found this week.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default CommunityDashboard;
