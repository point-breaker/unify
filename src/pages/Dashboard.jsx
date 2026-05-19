import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Wallet, Users, ArrowRight, Sun, Cloud, CloudRain } from 'lucide-react';
import styles from './Dashboard.module.css';
import { useHealth } from '../contexts/HealthContext';
import { useFinance } from '../contexts/FinanceContext';
import { useCommunity } from '../contexts/CommunityContext';
import { useLocation } from '../contexts/LocationContext';

const Dashboard = () => {
    const { healthState } = useHealth();
    const { financeState } = useFinance();
    const { communityState, unit } = useCommunity();
    const { location } = useLocation();

    // Helper for Weather Icon (Duplicated temporarily, or could be in utils)
    const renderWeatherIcon = (code) => {
        if (!code && code !== 0) return <Sun size={24} color="white" />;
        if (code <= 3) return <Sun size={24} color="white" />;
        if (code <= 60) return <Cloud size={24} color="white" />;
        return <CloudRain size={24} color="white" />;
    };

    const getWeatherText = (code) => {
        if (code <= 3) return 'Clear';
        if (code <= 60) return 'Cloudy';
        if (code >= 80) return 'Rainy';
        return 'Fair';
    };

    return (
        <div className={styles.container}>
            <header className={styles.hero}>
                <h1>Good Morning!</h1>
                <p>Welcome to your Unify hub in {location.city}.</p>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8, display: 'flex', gap: 12 }}>
                    <span>{location.country === 'US' ? '🇺🇸' : '📍'} {location.city}</span>
                    <span>{communityState.weather ? `${Math.round(unit === 'C' ? communityState.weather.tempC : communityState.weather.tempF)}°${unit}` : '--'}</span>
                    <span>AQI: {communityState.aqi || '--'}</span>
                </div>
            </header>

            <div className={styles.grid}>
                {/* Health Summary */}
                <Link to="/health" className={styles.card} style={{ '--accent': 'var(--grad-health)' }}>
                    <div className={styles.cardHeader}>
                        <div className={styles.iconBox}>
                            <Activity size={24} color="white" />
                        </div>
                        <h2>Health</h2>
                    </div>
                    <div className={styles.metric}>
                        <span className={styles.value}>{healthState?.score || '--'}</span>
                        <span className={styles.label}>Team Score</span>
                    </div>
                    <div className={styles.subtext}>
                        {(healthState?.steps || 0).toLocaleString()} steps today
                    </div>
                    <div className={styles.footer}>
                        <span>View Dashboard</span>
                        <ArrowRight size={16} />
                    </div>
                </Link>
 
                {/* Finance Summary */}
                <Link to="/finance" className={styles.card} style={{ '--accent': 'var(--grad-finance)' }}>
                    <div className={styles.cardHeader}>
                        <div className={styles.iconBox}>
                            <Wallet size={24} color="white" />
                        </div>
                        <h2>Finance</h2>
                    </div>
                    <div className={styles.metric}>
                        <span className={styles.value}>{location?.currency || '$'}{(financeState?.netWorth || 0).toLocaleString()}</span>
                        <span className={styles.label}>Net Worth</span>
                    </div>
                    <div className={styles.subtext}>
                        {financeState?.isBudgetOnTrack ? '✅ On Budget Track' : '⚠️ Over Budget'}
                    </div>
                    <div className={styles.footer}>
                        <span>View Wallet</span>
                        <ArrowRight size={16} />
                    </div>
                </Link>

                {/* Community Summary */}
                <Link to="/community" className={styles.card} style={{ '--accent': 'var(--grad-community)' }}>
                    <div className={styles.cardHeader}>
                        <div className={styles.iconBox}>
                            {renderWeatherIcon(communityState.weather?.code)}
                        </div>
                        <h2>Community</h2>
                    </div>
                    <div className={styles.metric}>
                        <span className={styles.value}>
                            {communityState.weather ? getWeatherText(communityState.weather.code) : 'Loading...'}
                        </span>
                        <span className={styles.label}>{communityState.currentAdvice}</span>
                    </div>
                    <div className={styles.subtext}>
                        {communityState.uv > 5 ? 'High UV Alert' : 'Normal Conditions'}
                    </div>
                    <div className={styles.footer}>
                        <span>View Pulse</span>
                        <ArrowRight size={16} />
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
