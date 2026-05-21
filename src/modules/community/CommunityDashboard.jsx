import React, { useState, useEffect } from 'react';
import { CloudRain, Wind, MapPin, AlertTriangle, Info, Calendar, Users, Sun, Cloud, Thermometer, Droplets, Activity, ToggleLeft, ToggleRight, ExternalLink, Plus, Trash2, Clock, User, X, Bell, BellOff, Volume2 } from 'lucide-react';
import styles from './Community.module.css';
import { useLocation } from '../../contexts/LocationContext';
import { useCommunity } from '../../contexts/CommunityContext';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

const CURATED_NEWS = [
    {
        id: "kerala-assembly",
        title: "16th Kerala Legislative Assembly Swearing-In and Session Commences",
        source: "TwentyFour News",
        date: "2026-05-21",
        isLocalForCountry: "IN",
        category: "Politics",
        bullets: [
            "The 16th Kerala Legislative Assembly session officially begins today at 9:00 AM.",
            "Swearing-in ceremony of newly elected MLAs features a significant number of new and younger faces.",
            "Strict security measures and parliamentary protocols have been deployed across the assembly complex."
        ],
        link: "https://www.twentyfournews.com/kerala/assembly-session-begins-2026"
    },
    {
        id: "drishyam-3-launch",
        title: "Drishyam 3 Officially Launched on Mohanlal's Birthday",
        source: "TwentyFour News",
        date: "2026-05-21",
        isLocalForCountry: "IN",
        category: "Entertainment",
        bullets: [
            "Production for the highly anticipated sequel 'Drishyam 3' officially kicks off today.",
            "The launch coincides with lead actor Mohanlal's birthday, sparking massive fan celebrations.",
            "Director Jeethu Joseph and the core production team held a special pooja ceremony to mark the start of shooting."
        ],
        link: "https://www.twentyfournews.com/entertainment/drishyam-3-launch-mohanlal-birthday"
    },
    {
        id: "modeling-racket",
        title: "Suspicious WhatsApp Leaks Expose Local Modeling Front Racket",
        source: "TwentyFour News",
        date: "2026-05-21",
        isLocalForCountry: "IN",
        category: "Crime",
        bullets: [
            "Leaked WhatsApp chat transcripts have exposed a major modeling-front exploitation racket operating in Kerala.",
            "Racket coordinator Sindhu is accused of exploiting aspiring models under the guise of fashion opportunities.",
            "Kerala Police cyber cell has initiated a formal probe into the digital footprints and financial transactions of the accused."
        ],
        link: "https://www.twentyfournews.com/kerala/modeling-racket-whatsapp-chats-leaked"
    },
    {
        id: "kv-thomas-tn",
        title: "KV Thomas Confirms Ongoing Talks to Serve as Tamil Nadu's Special Representative",
        source: "TwentyFour News",
        date: "2026-05-21",
        isLocalForCountry: "IN",
        category: "Politics",
        bullets: [
            "Veteran politician KV Thomas has confirmed active discussions with the Tamil Nadu government.",
            "If finalized, he will serve as TN's Special Representative in New Delhi to coordinate inter-state affairs.",
            "The potential appointment marks a unique cross-state political liaison role for the veteran Kerala leader."
        ],
        link: "https://www.twentyfournews.com/news/kv-thomas-tamil-nadu-representative-talks"
    },
    {
        id: "malaidamthuruthu-protest",
        title: "Cases Registered Against 50 Eviction Protesters in Malaidamthuruthu",
        source: "TwentyFour News",
        date: "2026-05-21",
        isLocalForCountry: "IN",
        category: "Law & Order",
        bullets: [
            "Police have registered formal cases against 50 local residents participating in an eviction block protest.",
            "The demonstration was organized to halt controversial land acquisition and eviction procedures in Malaidamthuruthu.",
            "Local action committees vow to continue peaceful blockades until rehabilitation terms are negotiated."
        ],
        link: "https://www.twentyfournews.com/kerala/malaidamthuruthu-protest-cases-registered"
    },
    {
        id: "trump-netanyahu-call",
        title: "Trump and Netanyahu Hold Tense Call Over Iran Strategy",
        source: "BBC News",
        date: "2026-05-21",
        isLocalForCountry: null,
        category: "Global",
        bullets: [
            "US President Donald Trump and Israeli Prime Minister Benjamin Netanyahu held a high-tension telephone call today.",
            "Discussions focused heavily on the strategic direction of the ongoing conflict and containment of Iran.",
            "Reports indicate Israeli leadership expressed deep dissatisfaction with recent logistical and policy delays."
        ],
        link: "https://www.bbc.com/news/world-middle-east-trump-netanyahu-iran-call"
    }
];

const CURATED_EVENTS = [
    {
        id: "kerala-it-fest",
        title: "Kerala IT Fest 2026 & Startup Expo",
        newspaperSource: "Mathrubhumi",
        date: "May 25, 2026",
        location: "Infopark Kochi, Kerala",
        isLocalForCountry: "IN",
        link: "https://www.mathrubhumi.com/technology/kerala-it-fest-2026"
    },
    {
        id: "kochi-biennale-showcase",
        title: "Biennale Contemporary Art Showcase",
        newspaperSource: "Malayala Manorama",
        date: "May 28, 2026",
        location: "Fort Kochi, Kerala",
        isLocalForCountry: "IN",
        link: "https://www.manoramaonline.com/art/biennale-showcase-kochi-2026"
    },
    {
        id: "monsoon-agri-expo",
        title: "Kerala Monsoon Agri & Organic Produce Fair",
        newspaperSource: "Kerala Kaumudi",
        date: "June 2, 2026",
        location: "Trivandrum Exhibition Grounds",
        isLocalForCountry: "IN",
        link: "https://www.keralakaumudi.com/news/monsoon-agri-expo-trivandrum"
    },
    {
        id: "un-climate-summit",
        title: "Global Climate Action Summit 2026",
        newspaperSource: "The Guardian",
        date: "June 5, 2026",
        location: "Geneva, Switzerland (Hybrid)",
        isLocalForCountry: null,
        link: "https://www.theguardian.com/environment/un-climate-summit-geneva-2026"
    },
    {
        id: "vanguard-tech-ai-summit",
        title: "Vanguard Tech & Next-Gen AI Conference",
        newspaperSource: "The New York Times",
        date: "May 30, 2026",
        location: "San Francisco, CA / Online",
        isLocalForCountry: null,
        link: "https://www.nytimes.com/technology/vanguard-ai-summit-2026"
    }
];

const getEventDateParts = (dateStr) => {
    if (!dateStr) return { month: 'Date', day: '?' };
    
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            // Append T00:00:00 to treat as local date, preventing timezone offset bugs
            const dateObj = new Date(dateStr + 'T00:00:00');
            if (!isNaN(dateObj.getTime())) {
                const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                const day = dateObj.toLocaleDateString('en-US', { day: 'numeric' });
                return { month, day };
            }
        }
    }
    
    const spaceSplit = dateStr.split(' ');
    if (spaceSplit.length >= 2) {
        const month = spaceSplit[0];
        const dayObj = spaceSplit[1].replace(',', '');
        return { month, day: dayObj };
    }
    
    return { month: 'Date', day: '?' };
};

const CommunityDashboard = () => {
    const { location, loading } = useLocation();
    const { communityState, unit, toggleUnit } = useCommunity();
    const { weather, aqi, uv, currentAdvice } = communityState;

    // Use Context for Weather Data directly
    // const [weather, setWeather] = useState(null); 
    // const [aqi, setAqi] = useState(null);
    // const [uv, setUv] = useState(null);

    const [customEvents, setCustomEvents] = useState([]);
    const [rsvpEvents, setRsvpEvents] = useState([]);
    const [reminderEvents, setReminderEvents] = useState([]);
    const [dismissedReminders, setDismissedReminders] = useState([]);
    const [activeIncomingCall, setActiveIncomingCall] = useState(null);
    const [isCallAnswered, setIsCallAnswered] = useState(false);
    const [activeAudioObj, setActiveAudioObj] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        date: '',
        time: '',
        location: '',
        type: 'event'
    });
    
    const { currentUser } = useAuth();
    const [communityStats, setCommunityStats] = useState({
        eventsJoined: 3,
        hoursVolunteered: 12,
        donatedAmount: 50,
        level: 1,
        title: "Local Helper"
    });

    // Fetch and sync user community statistics and custom events/reminders from Firestore
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
                    if (data.customEvents) {
                        setCustomEvents(data.customEvents);
                    }
                    if (data.rsvpEvents) {
                        setRsvpEvents(data.rsvpEvents);
                    }
                    if (data.reminderEvents) {
                        setReminderEvents(data.reminderEvents);
                    }
                    if (data.dismissedReminders) {
                        setDismissedReminders(data.dismissedReminders);
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

    const sortedNews = React.useMemo(() => {
        const country = location?.country || 'US';
        return [...CURATED_NEWS].sort((a, b) => {
            const aIsLocal = a.isLocalForCountry === country;
            const bIsLocal = b.isLocalForCountry === country;
            if (aIsLocal && !bIsLocal) return -1;
            if (!aIsLocal && bIsLocal) return 1;
            return 0;
        });
    }, [location?.country]);

    const sortedEvents = React.useMemo(() => {
        const country = location?.country || 'US';
        
        // Prioritize and sort curated newspaper events
        const sortedCurated = [...CURATED_EVENTS].sort((a, b) => {
            const aIsLocal = a.isLocalForCountry === country;
            const bIsLocal = b.isLocalForCountry === country;
            if (aIsLocal && !bIsLocal) return -1;
            if (!aIsLocal && bIsLocal) return 1;
            return 0;
        });

        // Custom user events
        const mappedCustom = customEvents.map(evt => ({
            ...evt,
            isCustom: true,
            newspaperSource: null
        }));

        // Merge user custom events first, then the sorted newspaper-curated ones
        return [...mappedCustom, ...sortedCurated];
    }, [customEvents, location?.country]);

    const handleAddEvent = async (e) => {
        e.preventDefault();
        if (!currentUser || !newEvent.title || !newEvent.date) return;

        const eventObj = {
            id: Date.now().toString(),
            title: newEvent.title,
            date: newEvent.date,
            time: newEvent.time || 'All Day',
            location: newEvent.location || 'Local',
            type: newEvent.type, // 'event' or 'reminder'
            rsvp: newEvent.type === 'event'
        };

        const updatedEvents = [...customEvents, eventObj];
        setCustomEvents(updatedEvents);

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, { customEvents: updatedEvents }, { merge: true });

            if (eventObj.type === 'event') {
                await updateCommunityStat('eventsJoined', 1);
            }

            setNewEvent({ title: '', date: '', time: '', location: '', type: 'event' });
            setIsFormOpen(false);
        } catch (err) {
            console.error("Failed to add custom event:", err);
        }
    };

    const handleDeleteEvent = async (eventId, eventType) => {
        if (!currentUser) return;
        const updatedEvents = customEvents.filter(evt => evt.id !== eventId);
        setCustomEvents(updatedEvents);

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, { customEvents: updatedEvents }, { merge: true });

            if (eventType === 'event') {
                await updateCommunityStat('eventsJoined', -1);
            }
        } catch (err) {
            console.error("Failed to delete custom event:", err);
        }
    };

    const handleToggleRsvp = async (eventId) => {
        if (!currentUser) return;

        const isRsvpd = rsvpEvents.includes(eventId);
        let updatedRsvps;
        if (isRsvpd) {
            updatedRsvps = rsvpEvents.filter(id => id !== eventId);
            await updateCommunityStat('eventsJoined', -1);
        } else {
            updatedRsvps = [...rsvpEvents, eventId];
            await updateCommunityStat('eventsJoined', 1);
        }

        setRsvpEvents(updatedRsvps);

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, { rsvpEvents: updatedRsvps }, { merge: true });
        } catch (err) {
            console.error("Failed to update RSVP:", err);
        }
    };

    const handleToggleReminder = async (eventId) => {
        if (!currentUser) return;

        const isReminderActive = reminderEvents.includes(eventId);
        let updatedReminders;
        if (isReminderActive) {
            updatedReminders = reminderEvents.filter(id => id !== eventId);
        } else {
            updatedReminders = [...reminderEvents, eventId];
        }

        setReminderEvents(updatedReminders);

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, { reminderEvents: updatedReminders }, { merge: true });
        } catch (err) {
            console.error("Failed to update reminder toggle:", err);
        }
    };

    const playSynthesizedRingtone = () => {
        if (typeof window === 'undefined') return null;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return null;

        try {
            const ctx = new AudioContext();
            let isPlaying = true;
            let vibrationInterval = null;

            const playBeep = () => {
                if (!isPlaying) return;
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();

                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(ctx.destination);

                osc1.frequency.setValueAtTime(440, ctx.currentTime);
                osc2.frequency.setValueAtTime(480, ctx.currentTime);

                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.15, ctx.currentTime + 1.8);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);

                osc1.start(ctx.currentTime);
                osc2.start(ctx.currentTime);
                osc1.stop(ctx.currentTime + 2.0);
                osc2.stop(ctx.currentTime + 2.0);

                setTimeout(() => {
                    if (isPlaying) playBeep();
                }, 4000);
            };

            playBeep();

            if (navigator.vibrate) {
                navigator.vibrate([600, 400, 600, 400, 600]);
                vibrationInterval = setInterval(() => {
                    if (isPlaying) {
                        navigator.vibrate([600, 400, 600, 400, 600]);
                    }
                }, 4000);
            }

            return {
                stop: () => {
                    isPlaying = false;
                    if (vibrationInterval) clearInterval(vibrationInterval);
                    ctx.close();
                }
            };
        } catch (e) {
            console.error("Web Audio ringtone failed to start:", e);
            return null;
        }
    };

    const playAnswerBeep = () => {
        if (typeof window === 'undefined') return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(660, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
            
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
            
            setTimeout(() => ctx.close(), 500);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSimulateReminderCall = (evt) => {
        if (activeIncomingCall) return;

        setActiveIncomingCall(evt);
        setIsCallAnswered(false);

        const audioObj = playSynthesizedRingtone();
        setActiveAudioObj(audioObj);
    };

    const handleAnswerCall = () => {
        if (activeAudioObj) {
            activeAudioObj.stop();
            setActiveAudioObj(null);
        }
        playAnswerBeep();
        setIsCallAnswered(true);
    };

    const handleDismissReminder = async (eventId) => {
        if (!currentUser) return;

        if (activeAudioObj) {
            activeAudioObj.stop();
            setActiveAudioObj(null);
        }

        const updatedDismissed = [...dismissedReminders, eventId];
        setDismissedReminders(updatedDismissed);
        setActiveIncomingCall(null);
        setIsCallAnswered(false);

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, { dismissedReminders: updatedDismissed }, { merge: true });
        } catch (err) {
            console.error("Failed to dismiss reminder:", err);
        }
    };

    const getReminderTriggerTime = (dateStr) => {
        if (!dateStr) return null;
        let eventDate;
        if (dateStr.includes('-')) {
            eventDate = new Date(dateStr + 'T00:00:00');
        } else {
            eventDate = new Date(dateStr);
        }
        if (isNaN(eventDate.getTime())) return null;

        const triggerTime = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
        triggerTime.setHours(12, 0, 0, 0);
        return triggerTime;
    };

    // Background interval check for scheduled event reminders (day before at 12:00 Noon local time)
    useEffect(() => {
        if (!currentUser || sortedEvents.length === 0) return;

        const checkReminders = () => {
            const now = new Date();
            for (const evt of sortedEvents) {
                if (reminderEvents.includes(evt.id) && !dismissedReminders.includes(evt.id)) {
                    const triggerTime = getReminderTriggerTime(evt.date);
                    if (triggerTime && now >= triggerTime) {
                        handleSimulateReminderCall(evt);
                        break;
                    }
                }
            }
        };

        checkReminders();
        const checkInterval = setInterval(checkReminders, 10000);

        return () => {
            clearInterval(checkInterval);
        };
    }, [reminderEvents, dismissedReminders, sortedEvents, currentUser]);

    // Clean up ringing on unmount
    useEffect(() => {
        return () => {
            if (activeAudioObj) {
                activeAudioObj.stop();
            }
        };
    }, [activeAudioObj]);

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
                        <h3 className={styles.sectionTitle}>Main Stories</h3>
                        <span style={{ fontSize: 10, opacity: 0.8, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' }}>
                            TODAY • {sortedNews.length} Stories
                        </span>
                    </div>
                    <div className={styles.newsList}>
                        {sortedNews.map((news) => {
                            const isLocal = news.isLocalForCountry === (location?.country || 'US');
                            return (
                                <div 
                                    key={news.id} 
                                    className={`${styles.newsCard} ${isLocal ? styles.newsCardLocal : ''}`}
                                >
                                    <div className={styles.newsHeader}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <span className={styles.newsCategory}>{news.category}</span>
                                            {isLocal && (
                                                <span className={styles.spotlightBadge}>
                                                    📍 Local Spotlight
                                                </span>
                                            )}
                                        </div>
                                        <span className={styles.newsTime}>Today</span>
                                    </div>
                                    
                                    <a 
                                        href={news.link} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className={styles.newsTitleLink}
                                    >
                                        <h4 className={styles.newsTitle}>
                                            {news.title}
                                            <ExternalLink size={14} className={styles.externalIcon} />
                                        </h4>
                                    </a>

                                    <div className={styles.newsMeta}>
                                        {news.source}
                                    </div>

                                    <ul className={styles.newsBullets}>
                                        {news.bullets.map((bullet, bIdx) => (
                                            <li key={bIdx} className={styles.bulletPoint}>
                                                {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Events Feed */}
                <section className={styles.section}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 className={styles.sectionTitle}>Upcoming Events</h3>
                        <button
                            onClick={() => setIsFormOpen(!isFormOpen)}
                            className={styles.addEventTrigger}
                            title="Add Custom Event or Reminder"
                        >
                            {isFormOpen ? <X size={14} /> : <Plus size={14} />}
                            <span>{isFormOpen ? 'Cancel' : 'Add Item'}</span>
                        </button>
                    </div>

                    {/* Interactive Glassmorphic Form */}
                    {isFormOpen && (
                        <form onSubmit={handleAddEvent} className={styles.eventForm}>
                            <h4 className={styles.formTitle}>New Custom {newEvent.type === 'event' ? 'Event' : 'Reminder'}</h4>
                            
                            <div className={styles.formTypeToggle}>
                                <button
                                    type="button"
                                    className={`${styles.toggleBtn} ${newEvent.type === 'event' ? styles.toggleActive : ''}`}
                                    onClick={() => setNewEvent({ ...newEvent, type: 'event' })}
                                >
                                    <User size={14} />
                                    <span>Event</span>
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.toggleBtn} ${newEvent.type === 'reminder' ? styles.toggleActive : ''}`}
                                    onClick={() => setNewEvent({ ...newEvent, type: 'reminder' })}
                                >
                                    <Clock size={14} />
                                    <span>Reminder</span>
                                </button>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder={newEvent.type === 'event' ? "e.g., Beach Volunteering Cleanup" : "e.g., Call local recycling center"}
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    className={styles.formInput}
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                    <label className={styles.formLabel}>Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newEvent.date}
                                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                        className={styles.formInput}
                                    />
                                </div>
                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                    <label className={styles.formLabel}>Time</label>
                                    <input
                                        type="time"
                                        value={newEvent.time}
                                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                        className={styles.formInput}
                                    />
                                </div>
                            </div>

                            {newEvent.type === 'event' && (
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Location</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Fort Kochi, Kerala"
                                        value={newEvent.location}
                                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                        className={styles.formInput}
                                    />
                                </div>
                            )}

                            <button type="submit" className={styles.formSubmitBtn}>
                                Add {newEvent.type === 'event' ? 'Event' : 'Reminder'}
                            </button>
                        </form>
                    )}

                    <div className={styles.eventsList}>
                        {sortedEvents.length > 0 ? sortedEvents.map((evt) => {
                            const isJoined = rsvpEvents.includes(evt.id);
                            const { month, day } = getEventDateParts(evt.date);
                            
                            // Determine style class and colors for the dateBox dynamically
                            let dateBoxStyle = {};
                            
                            if (evt.isCustom) {
                                if (evt.type === 'reminder') {
                                    dateBoxStyle = {
                                        background: 'rgba(245, 158, 11, 0.15)',
                                        borderColor: 'rgba(245, 158, 11, 0.3)'
                                    };
                                } else {
                                    dateBoxStyle = {
                                        background: 'rgba(99, 102, 241, 0.15)',
                                        borderColor: 'rgba(99, 102, 241, 0.3)'
                                    };
                                }
                            } else if (isJoined) {
                                dateBoxStyle = {
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    borderColor: 'rgba(16, 185, 129, 0.3)'
                                };
                            }

                            return (
                                <div key={evt.id} className={`${styles.eventItem} ${evt.isCustom ? styles.eventItemCustom : ''}`}>
                                    <div className={styles.dateBox} style={dateBoxStyle}>
                                        <span 
                                            className={styles.dateMonth}
                                            style={{
                                                color: evt.isCustom
                                                    ? (evt.type === 'reminder' ? '#F59E0B' : '#818CF8')
                                                    : (isJoined ? '#10B981' : 'var(--text-secondary)')
                                            }}
                                        >
                                            {month}
                                        </span>
                                        <span 
                                            className={styles.dateDay}
                                            style={{
                                                color: evt.isCustom
                                                    ? (evt.type === 'reminder' ? '#F59E0B' : '#818CF8')
                                                    : (isJoined ? '#10B981' : 'var(--text-primary)')
                                            }}
                                        >
                                            {day}
                                        </span>
                                    </div>
                                    <div className={styles.eventDetails}>
                                        {evt.isCustom ? (
                                            <h4>{evt.title}</h4>
                                        ) : (
                                            <a href={evt.link} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                                <h4>
                                                    {evt.title}
                                                    <ExternalLink size={12} className={styles.eventLinkIcon} style={{ marginLeft: 6, display: 'inline-block', verticalAlign: 'middle', opacity: 0.6 }} />
                                                </h4>
                                            </a>
                                        )}
                                        <div className={styles.meta}>
                                            {evt.isCustom ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    {evt.type === 'event' ? (
                                                        <span className={`${styles.customBadge} ${styles.badgeEvent}`}>
                                                            👤 Personal Event
                                                        </span>
                                                    ) : (
                                                        <span className={`${styles.customBadge} ${styles.badgeReminder}`}>
                                                            ⏰ Reminder
                                                        </span>
                                                    )}
                                                    {evt.time && <span>• {evt.time}</span>}
                                                    {evt.location && <span>• {evt.location}</span>}
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    <span className={styles.newspaperBadge}>
                                                        📰 {evt.newspaperSource}
                                                    </span>
                                                    <span>• {evt.location}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.eventActions}>
                                        <button
                                            onClick={() => handleToggleReminder(evt.id)}
                                            className={`${styles.reminderBtn} ${reminderEvents.includes(evt.id) ? styles.activeBell : ''}`}
                                            title={reminderEvents.includes(evt.id) ? "Remove Reminder" : "Set Reminder (Day before at 12 PM)"}
                                        >
                                            {reminderEvents.includes(evt.id) ? <Bell size={16} /> : <BellOff size={16} />}
                                        </button>

                                        {reminderEvents.includes(evt.id) && (
                                            <button
                                                onClick={() => handleSimulateReminderCall(evt)}
                                                className={styles.demoAlarmBtn}
                                                title="Trigger Demo Alarm Call Now"
                                            >
                                                <Volume2 size={14} />
                                                <span>Demo</span>
                                            </button>
                                        )}

                                        {evt.isCustom ? (
                                            <button
                                                onClick={() => handleDeleteEvent(evt.id, evt.type)}
                                                className={styles.deleteBtn}
                                                title={`Delete Custom ${evt.type}`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleToggleRsvp(evt.id)}
                                                className={styles.joinBtn}
                                                style={{
                                                    background: isJoined ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                                    color: isJoined ? 'var(--success)' : 'var(--text-secondary)',
                                                    border: isJoined ? '1px solid var(--success)' : '1px solid var(--glass-border)',
                                                    width: 'auto',
                                                    padding: '0 12px',
                                                    gap: 6
                                                }}
                                            >
                                                {isJoined ? 'Going' : 'RSVP'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                                No upcoming events scheduled. Click "Add Item" to create one!
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Simulated Ringing Call Overlay */}
            {activeIncomingCall && !isCallAnswered && (
                <div className={styles.callOverlay}>
                    <div className={styles.callerContainer}>
                        <div className={`${styles.callerAvatar} ${styles.pulseAvatar}`}>📞</div>
                        <h3 className={styles.callerName}>Unify Assistant</h3>
                        <p className={styles.callerStatus}>Incoming Event Reminder Call...</p>
                        <h4 className={styles.callEventTitle}>{activeIncomingCall.title}</h4>
                        <p className={styles.callEventMeta}>Tomorrow at {activeIncomingCall.time || 'All Day'}</p>
                    </div>
                    <div className={styles.callActionRow}>
                        <button onClick={() => handleDismissReminder(activeIncomingCall.id)} className={styles.declineCallBtn}>
                            Decline
                        </button>
                        <button onClick={handleAnswerCall} className={styles.answerCallBtn}>
                            Answer
                        </button>
                    </div>
                </div>
            )}
            {/* Active Call Conversation Overlay */}
            {activeIncomingCall && isCallAnswered && (
                <div className={styles.callOverlay}>
                    <div className={styles.callerContainer}>
                        <div className={styles.visualizerWave}>
                            <span /><span /><span /><span /><span />
                        </div>
                        <h3 className={styles.callerName}>Call Active</h3>
                        <div className={styles.speechBubble}>
                            "Hello! This is your Unify voice reminder. Your event, <strong>{activeIncomingCall.title}</strong>, is scheduled for tomorrow at {activeIncomingCall.time || 'All Day'}. Have a wonderful day!"
                        </div>
                    </div>
                    <button onClick={() => handleDismissReminder(activeIncomingCall.id)} className={styles.hangUpBtn}>
                        Hang Up
                    </button>
                </div>
            )}
        </div>
    );
};

export default CommunityDashboard;
