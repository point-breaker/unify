import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Heart, Activity, Moon, Utensils, Scale, Calculator, Shield } from 'lucide-react';
import styles from './Health.module.css';
import { useHealth } from '../../contexts/HealthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { bluetoothManager } from './BluetoothManager';
import DietaryAdvisor from './DietaryAdvisor';

// Helper to parse dynamic meal portions and calories from compiled AI recommendation markdown
const parseDietaryPlanToMeals = (recommendationText) => {
    if (!recommendationText || typeof recommendationText !== 'string') return [];
    
    const meals = [];
    const lines = recommendationText.split('\n');
    
    // Match line format: - **Breakfast** [Portion: **Xg** | **Y kcal**]: description...
    const mealRegex = /-\s+\*\*([^*]+)\*\*\s+\[Portion:\s+\*\*([^*]+)\*\*\s+\|\s+\*\*([^*]+)\*\*\]:\s*(.*)/i;
    
    lines.forEach(line => {
        const match = line.match(mealRegex);
        if (match) {
            const type = match[1].trim();      // "Breakfast"
            const portion = match[2].trim();   // "Xg"
            const cals = match[3].trim();      // "Y kcal"
            let desc = match[4].trim();        // "Meal text..."
            
            // Clean bold markdown characters
            desc = desc.replace(/\*\*/g, '');
            
            // Split into a clean Title and Description on punctuation/colon
            const titleParts = desc.split(':');
            let title = desc;
            let finalDesc = '';
            
            if (titleParts.length > 1) {
                title = titleParts[0].trim();
                finalDesc = titleParts.slice(1).join(':').trim();
            } else {
                const firstPeriod = desc.indexOf('.');
                if (firstPeriod > 0) {
                    title = desc.slice(0, firstPeriod).trim();
                    finalDesc = desc.slice(firstPeriod + 1).trim();
                }
            }

            if (title.length > 45) {
                title = type + " Recommendations";
                finalDesc = desc;
            }

            // Generate contextual tags based on food choices in the plan
            const tags = [];
            const lowerDesc = desc.toLowerCase();
            if (lowerDesc.includes('potassium')) tags.push('Renal Safeguard');
            if (lowerDesc.includes('sodium') || lowerDesc.includes('salt')) tags.push('Low Sodium');
            if (lowerDesc.includes('fiber') || lowerDesc.includes('oats')) tags.push('High Fiber');
            if (lowerDesc.includes('protein') || lowerDesc.includes('salmon') || lowerDesc.includes('chicken') || lowerDesc.includes('egg')) tags.push('High Protein');
            if (lowerDesc.includes('glycemic') || lowerDesc.includes('sugar') || lowerDesc.includes('carb')) tags.push('Glycemic Control');
            if (tags.length === 0) tags.push('Balanced');

            meals.push({
                type,
                portion,
                cals,
                title,
                desc: finalDesc || 'Balanced meal recommendation matching clinical logic.',
                tags
            });
        }
    });
    
    return meals;
};

// --- AI Coach Component ---
const AIInsights = ({ healthState }) => {
    const getInsight = () => {
        const { steps, heartRate, sleep } = healthState;
        if (heartRate > 100 && steps < 1000) return "You're stressed! Your heart rate is high but activity is low. Try a 5-minute breathing exercise.";
        if (steps > 8000) return "Great job! You've hit your step goal. Recovery is key—ensure you get 8 hours of sleep tonight.";
        if (sleep < 6) return "Low sleep detected. Prioritize rest today and avoid heavy lifting.";
        return "Consistency is key! Try to get a 10-minute walk in before lunch.";
    };

    return (
        <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', padding: 16, borderRadius: 12, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: '50%' }}>
                <Calculator size={20} color="white" />
            </div>
            <div>
                <h4 style={{ margin: 0, color: 'white', fontSize: 14 }}>AI Coach Insight</h4>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 }}>{getInsight()}</p>
            </div>
        </div>
    );
};



const HealthDashboard = () => {
    // Mock Data (for demonstration purposes)
    const [mockData, setMockData] = useState({
        heartRateHistory: Array.from({ length: 30 }, (_, i) => ({ name: `${i + 1}`, uv: 70 + Math.floor(Math.random() * 30) })),
        sleepHistory: Array.from({ length: 30 }, (_, i) => ({ name: `${i + 1}`, uv: 6 + Math.random() * 3 })),
    });

    // --- Context Data ---
    const { currentUser } = useAuth();
    const { healthState, updateHealth } = useHealth();
    const { familyState, getHouseholdStats, getLeaderboard } = useFamily();

    // Admin / View State
    const [selectedMemberId, setSelectedMemberId] = useState('admin');
    const [viewMode, setViewMode] = useState('personal'); // 'personal' | 'household'

    // Aggregated Data
    const householdStats = getHouseholdStats ? getHouseholdStats() : null;
    const leaderboard = getLeaderboard ? getLeaderboard('health') : [];

    // Resolve Profile to Display
    let displayProfile = healthState.profile;
    let isPrivate = false;
    let displaySteps = healthState.steps;
    let displayHeartRate = healthState.heartRate;
    let displaySleep = healthState.sleep;
    let displayDietaryPlan = healthState.dietaryPlan;

    if (viewMode === 'household' && householdStats) {
        // In Household mode, we show aggregated data
        displaySteps = householdStats.steps || 0;
    } else if (familyState?.role === 'admin' && selectedMemberId !== 'admin') {
        // Admin viewing a specific member's profile
        const member = (familyState?.members || []).find(m => m.id === selectedMemberId);
        if (member) {
            if (member.profile) displayProfile = member.profile;
            if (member.permissions?.health === false) isPrivate = true;
            if (!isPrivate && member.health) {
                displaySteps = member.health.steps || 0;
                displayHeartRate = member.health.heartRate || '--';
                displaySleep = member.health.sleep || '--';
                displayDietaryPlan = member.health.dietaryPlan;
            }
        }
    }
    
    // Ensure render values are safely typed for React
    displaySleep = typeof displaySleep === 'object' ? JSON.stringify(displaySleep) : displaySleep;
    displayHeartRate = typeof displayHeartRate === 'object' ? '--' : displayHeartRate;

    // AI Insights Logic (Simple rules engine)
    const getAiInsight = () => {
        if (viewMode === 'household') {
            return {
                text: "Family Goal: You're 15k steps away from the collective 50k goal!",
                type: 'info'
            };
        }
        if (displaySteps < 5000) return { text: "Movement Alert: You've been stationary for 2 hours.", type: 'warning' };
        if (healthState.sleepQuality === 'Poor') return { text: "Recovery Focus: Try a 20min nap or meditation.", type: 'healing' };
        return { text: "Great pace! You're beating your weekly average.", type: 'success' };
    };
    const insight = getAiInsight();
    // Bluetooth BLE Heart Rate connection state hooks
    const [isBleConnected, setIsBleConnected] = useState(false);
    const [bleDeviceName, setBleDeviceName] = useState('');
    const [bleConnecting, setBleConnecting] = useState(false);

    const handleConnectBLE = async () => {
        setBleConnecting(true);
        try {
            const success = await bluetoothManager.connect((heartRate) => {
                updateHealth({ heartRate: heartRate });
            });
            if (success) {
                setIsBleConnected(true);
                setBleDeviceName(bluetoothManager.device?.name || 'BLE Heart Tracker');
            }
        } catch (error) {
            console.error('BLE connection failed:', error);
            alert('Failed to connect Bluetooth tracker: ' + error.message + '\n\nNote: Web Bluetooth requires Chrome, Edge, or Opera on HTTPS/Localhost.');
        }
        setBleConnecting(false);
    };

    const handleDisconnectBLE = () => {
        bluetoothManager.disconnect();
        setIsBleConnected(false);
        setBleDeviceName('');
    };

    // Mock Simulation Effect (Simulate steps increasing)
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                updateHealth({ steps: healthState.steps + Math.floor(Math.random() * 50) });
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [healthState.steps]);

    // ... Metric Calculation Logic (getMetrics) ...
    // Note: Reusing existing getMetrics function (hidden for brevity in replacement but kept in file)
    const getMetrics = (profile) => {
        if (!profile || !profile.height || !profile.weight || !profile.dob) return null;
        try {
            const heightM = parseFloat(profile.height) / 100;
            const weightKg = parseFloat(profile.weight);
            if (isNaN(heightM) || isNaN(weightKg) || heightM === 0) return null;
            const bmiRaw = weightKg / (heightM * heightM);
            const bmi = isFinite(bmiRaw) ? bmiRaw.toFixed(1) : '--';
            let bmiCategory = 'Normal';
            let bmiColor = 'var(--success)';
            if (bmiRaw < 18.5) { bmiCategory = 'Underweight'; bmiColor = 'var(--warning)'; }
            else if (bmiRaw >= 25 && bmiRaw < 29.9) { bmiCategory = 'Overweight'; bmiColor = 'var(--warning)'; }
            else if (bmiRaw >= 30) { bmiCategory = 'Obese'; bmiColor = '#EF4444'; }
            const birthDate = new Date(profile.dob);
            if (isNaN(birthDate.getTime())) return null;
            const ageDifMs = Date.now() - birthDate.getTime();
            const ageDate = new Date(ageDifMs);
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);
            let bmr = (10 * weightKg) + (6.25 * parseFloat(profile.height)) - (5 * age);
            if (profile.gender === 'male') bmr += 5; else bmr -= 161;
            return { bmi, bmiCategory, bmiColor, bmr: Math.round(bmr), age };
        } catch (e) { return null; }
    };




    const metrics = getMetrics(displayProfile);
    const parsedMeals = parseDietaryPlanToMeals(displayDietaryPlan?.recommendation);

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <div>
                    <h2 className={styles.title}>Health</h2>
                    <p className={styles.subtitle}>
                        {viewMode === 'household' ? 'Family Overview' : 'Daily Summary'} • Connected
                    </p>
                </div>

                {/* AI INSIGHT BUBBLE */}
                <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--accent)',
                    borderRadius: 20, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
                    boxShadow: '0 4px 20px rgba(37, 99, 235, 0.2)'
                }}>
                    <div style={{ background: 'var(--accent)', borderRadius: '50%', padding: 4 }}>
                        <Calculator size={14} color="white" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{insight.text}</span>
                </div>

                <div className={styles.controls}>
                    {/* View Mode Toggle */}
                    {familyState.role && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: 20 }}>
                            <div className={styles.toggleContainer}>
                                <button className={viewMode === 'personal' ? styles.activeTab : styles.tab} onClick={() => { setViewMode('personal'); setSelectedMemberId('admin'); }}>Me</button>
                                <button className={viewMode === 'household' ? styles.activeTab : styles.tab} onClick={() => setViewMode('household')}>Family</button>
                            </div>
                            
                            {/* Member Selector for Admin */}
                            {familyState.role === 'admin' && viewMode === 'personal' && (
                                <select 
                                    value={selectedMemberId} 
                                    onChange={(e) => setSelectedMemberId(e.target.value)}
                                    style={{
                                        background: 'rgba(15, 18, 24, 0.8)', color: 'white', 
                                        border: '1px solid var(--glass-border)', padding: '6px 12px', 
                                        borderRadius: '8px', fontSize: '13px', cursor: 'pointer'
                                    }}
                                >
                                    <option value="admin">My Health</option>
                                    {(familyState?.members || []).filter(m => m.id !== currentUser?.uid).map(m => (
                                        <option key={m.id} value={m.id}>{m.name}'s Health</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}
                    <div className={styles.scoreCard}>
                        <span className={styles.scoreLabel}>Health Score</span>
                        <span className={styles.scoreValue}>{viewMode === 'household' ? 92 : healthState.score}</span>
                    </div>
                </div>
            </header>


            {/* SETUP MODE (If no data) */}
            {healthState.steps === 0 && viewMode === 'personal' && !isPrivate ? (
                <div style={{ padding: 40, textAlign: 'center', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)', border: '1px dashed var(--accent)', borderRadius: 16, marginBottom: 20 }}>
                    <div style={{ background: 'var(--accent)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Activity size={24} color="white" />
                    </div>
                    <h3 style={{ fontSize: 20, marginBottom: 8 }}>Connect Your Health Data</h3>
                    <p style={{ maxWidth: 400, margin: '0 auto 24px', opacity: 0.8 }}>Sync your wearable device or enter your daily activity manually to unlock AI insights.</p>

                    <button
                        style={{ padding: '10px 24px', background: 'var(--accent)', borderRadius: 8, border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto' }}
                        onClick={() => updateHealth({ steps: 2430, heartRate: 72, sleep: '6h 45m', sleepQuality: 'Fair', score: 78 })}
                    >
                        <Activity size={16} />
                        Sync Apple Health
                    </button>
                    <div style={{ marginTop: 16, fontSize: 12, opacity: 0.6 }}>or entered manually via settings</div>
                </div>
            ) : (
                /* Primary Metrics Grid */
                <div className={styles.grid}>

                    <div className={`${styles.card} ${styles.activityCard}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.iconBox} style={{ background: 'var(--grad-health)' }}>
                                <Activity size={20} color="white" />
                            </div>
                            <h3>{viewMode === 'household' ? 'Total Family Steps' : 'Activity'}</h3>
                        </div>
                        <div className={styles.metric}>
                            <span className={styles.value}>{(displaySteps || 0).toLocaleString()}</span>
                            <span className={styles.unit}>steps</span>
                        </div>
                        <div className={styles.progressBar} style={{ marginTop: 10, background: 'rgba(255,255,255,0.1)' }}>
                            <div className={styles.progressFill} style={{ width: `${Math.min((displaySteps / (viewMode === 'household' ? 30000 : healthState.targetSteps)) * 100, 100)}%`, background: 'var(--success)' }}></div>
                        </div>
                    </div>

                    {/* LEADERBOARD (Replaces HR/Sleep in Household Mode) */}
                    {viewMode === 'household' ? (
                        <div className={styles.card} style={{ gridColumn: 'span 2' }}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconBox} style={{ background: '#F59E0B' }}>
                                    <Activity size={20} color="white" />
                                </div>
                                <h3>Step Leaderboard</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                                {leaderboard.map((m, i) => (
                                    <div key={m.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 8,
                                        border: m.isSelf ? '1px solid var(--accent)' : 'none'
                                    }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <span style={{ fontWeight: 700, color: i === 0 ? '#F59E0B' : '#888' }}>#{i + 1}</span>
                                            <span>{m.name}</span>
                                        </div>
                                        <span style={{ fontWeight: 600 }}>{m.score.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={`${styles.card} ${styles.hrCard}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.iconBox} style={{ background: '#EF4444', animation: isBleConnected ? 'pulse-sos 1.2s infinite' : 'none' }}>
                                            <Heart size={20} color="white" />
                                        </div>
                                        <h3>Heart Rate</h3>
                                    </div>
                                    <div className={styles.metric} style={{ marginBottom: '10px' }}>
                                        <span className={styles.value}>{Math.round(displayHeartRate || 72)}</span>
                                        <span className={styles.unit}>bpm</span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: isBleConnected ? '#34d399' : 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '14px' }}>
                                        {selectedMemberId !== 'admin' ? "○ Synced from member's device" : (isBleConnected ? `● Bluetooth GATT Stream (${bleDeviceName})` : '○ Simulated Rate (Connect BLE below)')}
                                    </span>
                                </div>

                                {/* BLE Connect/Disconnect Actions (Only for 'Me') */}
                                {selectedMemberId === 'admin' && (
                                    <div>
                                    {isBleConnected ? (
                                        <button 
                                            onClick={handleDisconnectBLE}
                                            style={{
                                                width: '100%', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                                                color: '#f87171', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px'
                                            }}
                                        >
                                            Disconnect BLE Tracker
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleConnectBLE}
                                            disabled={bleConnecting}
                                            style={{
                                                width: '100%', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                border: 'none', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer',
                                                fontWeight: '700', fontSize: '12px', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)'
                                            }}
                                        >
                                            {bleConnecting ? 'Scanning...' : '🔗 Connect BLE Tracker'}
                                        </button>
                                    )}
                                </div>
                                )}
                            </div>

                            <div className={`${styles.card} ${styles.sleepCard}`}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.iconBox} style={{ background: '#818CF8' }}>
                                        <Moon size={20} color="white" />
                                    </div>
                                    <h3>Sleep</h3>
                                </div>
                                <div className={styles.metric}>
                                    <span className={styles.value}>{displaySleep}</span>
                                    <span className={styles.unit}>quality: {selectedMemberId !== 'admin' ? 'Synced' : healthState.sleepQuality}</span>
                                </div>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: '85%' }}></div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Body Metrics Card (Personal Only) */}
                    {viewMode === 'personal' && (
                        metrics ? (
                            <div className={styles.card} style={{ gridColumn: 'span 3' }}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.iconBox} style={{ background: 'var(--grad-finance)' }}>
                                        <Scale size={20} color="black" />
                                    </div>
                                    <h3>Body Metrics</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 20, marginTop: 10 }}>
                                    {/* BMI */}
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12 }}>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>BMI</div>
                                        <div style={{ fontSize: 24, fontWeight: 700, color: metrics.bmiColor }}>{metrics.bmi}</div>
                                        <div style={{ fontSize: 12, opacity: 0.8 }}>{metrics.bmiCategory}</div>
                                    </div>

                                    {/* BMR */}
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12 }}>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>BMR (Daily Cals)</div>
                                        <div style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>{metrics.bmr}</div>
                                        <div style={{ fontSize: 12, opacity: 0.8 }}>Kcal / day</div>
                                    </div>

                                    {/* Age */}
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12 }}>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Metabolic Age</div>
                                        <div style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>{metrics.age}</div>
                                        <div style={{ fontSize: 12, opacity: 0.8 }}>Years</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.card} style={{ gridColumn: 'span 3', border: '1px dashed var(--gray-600)', background: 'rgba(255,255,255,0.02)' }}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.iconBox} style={{ background: '#666' }}>
                                        <Scale size={20} color="white" />
                                    </div>
                                    <h3>Complete Your Profile</h3>
                                </div>
                                <div className={styles.setupForm}>
                                    <p style={{ width: '100%', fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Enter details to unlock BMI and Meal Plans.</p>
                                    <input id="p-height" placeholder="Height (cm)" type="number" className={styles.setupInput} />
                                    <input id="p-weight" placeholder="Weight (kg)" type="number" className={styles.setupInput} />
                                    <button
                                        onClick={() => {
                                            const h = document.getElementById('p-height').value;
                                            const w = document.getElementById('p-weight').value;
                                            if (h && w) {
                                                updateHealth({
                                                    profile: { ...displayProfile, height: h, weight: w, dob: '1990-01-01', gender: 'male' }
                                                });
                                            }
                                        }}
                                        className={styles.setupBtn}
                                    >
                                        Save Profile
                                    </button>
                                </div>
                            </div>
                        )
                    )}
                </div>

            )}

            {/* AI Dietary Advisor Section (Hidden if viewing another member) */}
            {viewMode === 'personal' && !isPrivate && selectedMemberId === 'admin' && (
                <div style={{ marginBottom: 24, marginTop: 24 }}>
                    <DietaryAdvisor />
                </div>
            )}

            {/* Smart Meal Recommendations connected to AI Advisor */}
            {viewMode === 'personal' && !isPrivate && (
                <section className={styles.recommendations} style={{ marginTop: '32px', borderTop: '1px solid var(--glass-border)', paddingTop: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <div style={{ background: 'rgba(26, 188, 156, 0.2)', padding: 8, borderRadius: 8, border: '1px solid rgba(26, 188, 156, 0.4)' }}>
                            <Utensils size={20} color="#1abc9c" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Smart Meal Plan Cards</h3>
                            <p style={{ fontSize: 12, opacity: 0.7, margin: 0, color: 'var(--text-secondary)' }}>
                                Real-time dynamic portion cards synced with the **AI Advisor**
                            </p>
                        </div>
                    </div>

                    {parsedMeals.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', background: 'rgba(15, 18, 24, 0.4)', borderRadius: 12, border: '1px dashed var(--glass-border)' }}>
                            <Utensils size={32} color="var(--text-secondary)" style={{ marginBottom: 16, opacity: 0.5 }} />
                            <h3 style={{ fontSize: 15, marginBottom: 8, color: '#fff' }}>No Active Caloric Sync</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: '400px', margin: '0 auto', lineHeight: '1.5' }}>
                                Select your conditions and customize metrics in the **AI Dietary Advisor** above, then click **Generate** to build these dynamic meal cards instantly!
                            </p>
                        </div>
                    ) : (
                        <div className={styles.recGrid}>
                            {parsedMeals.map((meal, idx) => (
                                <div key={idx} className={styles.recCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12, background: 'rgba(15, 18, 24, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)', height: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                        <span style={{ fontSize: 11, fontWeight: '700', color: '#1abc9c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{meal.type}</span>
                                        <span style={{ fontSize: 10, background: 'rgba(26, 188, 156, 0.15)', border: '1px solid rgba(26, 188, 156, 0.3)', color: '#1abc9c', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                                            {meal.portion} | {meal.cals}
                                        </span>
                                    </div>
                                    <div style={{ flexGrow: 1 }}>
                                        <h4 style={{ marginBottom: 6, fontSize: 15, color: '#fff', fontWeight: '600' }}>{meal.title}</h4>
                                        <p style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>{meal.desc}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%', marginTop: '8px' }}>
                                        {meal.tags.map(tag => (
                                            <span key={tag} style={{ fontSize: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '2px 8px', borderRadius: '100px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div >
    );
};

export default HealthDashboard;
