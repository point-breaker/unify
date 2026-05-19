import React, { useState, useEffect } from 'react';
import { Bot, Activity, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useHealth } from '../../contexts/HealthContext';
import styles from './Health.module.css'; 
import { getDietaryPlan } from './DietaryRuleEngine'; 

// Available clinical conditions supported by the expert system
const AVAILABLE_CONDITIONS = [
    { id: 'diabetes', label: 'Diabetes (Type 1 & 2)', color: '#e74c3c' },
    { id: 'hypertension', label: 'Hypertension (High BP)', color: '#3498db' },
    { id: 'heart_disease', label: 'Heart Disease', color: '#e67e22' },
    { id: 'kidney_disease', label: 'Chronic Kidney Disease (CKD)', color: '#9b59b6' }
];

const DietaryAdvisor = () => {
    const { healthState, updateHealth, updateProfile } = useHealth();
    const [recommendation, setRecommendation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState(false);

    // Biometric Input State Overrides (pre-populated from profile)
    const [gender, setGender] = useState('male');
    const [age, setAge] = useState('30');
    const [weight, setWeight] = useState('70');
    const [height, setHeight] = useState('170');
    const [goal, setGoal] = useState('maintain');

    // (AVAILABLE_CONDITIONS is defined statically above the component)

    const [selectedConditions, setSelectedConditions] = useState([]);

    // Populate active chips and biometrics when profile loads
    useEffect(() => {
        if (healthState?.profile) {
            const prof = healthState.profile;
            if (prof.gender) setGender(prof.gender);
            if (prof.weight) setWeight(prof.weight.toString());
            if (prof.height) setHeight(prof.height.toString());
            if (prof.goal) setGoal(prof.goal);

            if (prof.dob) {
                const birthDate = new Date(prof.dob);
                const today = new Date();
                let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    calculatedAge--;
                }
                setAge(calculatedAge.toString());
            }
        }
    }, [healthState?.profile]);

    // Load existing recommendation from HealthContext on mount
    useEffect(() => {
        if (healthState?.dietaryPlan?.recommendation) {
            setRecommendation(healthState.dietaryPlan.recommendation);
            // Backport comma-separated string to active chips
            const savedString = (healthState.dietaryPlan.conditions || '').toLowerCase();
            const activeIds = AVAILABLE_CONDITIONS
                .filter(c => savedString.includes(c.id) || savedString.includes(c.label.toLowerCase()))
                .map(c => c.id);
            setSelectedConditions(activeIds);
        }
    }, [healthState?.dietaryPlan]);

    const toggleCondition = (id) => {
        setSelectedConditions(prev => 
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleGenerate = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError('');

        // Map IDs back to a readable string for the engine and Firestore (or use fallback)
        const conditionsText = selectedConditions.length > 0
            ? selectedConditions.map(id => AVAILABLE_CONDITIONS.find(c => c.id === id).label).join(', ')
            : 'General Wellness';

        const customProfile = {
            gender,
            age,
            weight,
            height,
            goal
        };

        try {
            // Simulated AI Analysis Delay
            await new Promise(resolve => setTimeout(resolve, 800));

            // Inference Engine Call
            const plan = getDietaryPlan(conditionsText, customProfile);

            if (!plan) {
                throw new Error('Failed to generate dietary plan.');
            }

            // Save to Context (Auto-syncs to Firestore under health.dietaryPlan)
            await updateHealth({
                dietaryPlan: {
                    recommendation: plan,
                    conditions: conditionsText,
                    updatedAt: new Date().toISOString()
                }
            });

            setRecommendation(plan);
            setExpanded(true);

        } catch (err) {
            console.error("Generation Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Premium Rich Markdown Renderer for clinical presentation
    const formatMarkdown = (text) => {
        if (!text) return null;

        const cleanBold = (str) => {
            return str.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #fff; font-weight: 600;">$1</strong>');
        };

        return text.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} style={{ height: '8px' }} />;

            // 1. Heading Renderer (###)
            if (trimmed.startsWith('###')) {
                const headingText = trimmed.replace(/^###\s*/, '');
                return (
                    <h4 
                        key={i} 
                        style={{ 
                            color: '#1abc9c', 
                            fontSize: '15px', 
                            fontWeight: '600', 
                            borderBottom: '1px solid rgba(26, 188, 156, 0.15)', 
                            paddingBottom: '6px', 
                            marginTop: '20px', 
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        dangerouslySetInnerHTML={{ __html: cleanBold(headingText) }}
                    />
                );
            }

            // 2. Blockquote / System Callouts (>)
            if (trimmed.startsWith('>')) {
                const quoteText = trimmed.replace(/^>\s*/, '');
                return (
                    <div 
                        key={i} 
                        style={{ 
                            borderLeft: '3px solid #1abc9c', 
                            background: 'rgba(26, 188, 156, 0.04)', 
                            padding: '10px 14px', 
                            borderRadius: '4px', 
                            margin: '12px 0', 
                            fontSize: '12.5px', 
                            color: 'var(--text-secondary)', 
                            fontStyle: 'italic',
                            lineHeight: '1.5'
                        }}
                        dangerouslySetInnerHTML={{ __html: cleanBold(quoteText) }}
                    />
                );
            }

            // 3. Bullet Lists (-)
            if (trimmed.startsWith('-')) {
                const listText = trimmed.replace(/^-\s*/, '');
                return (
                    <div 
                        key={i} 
                        style={{ 
                            display: 'flex', 
                            gap: '10px', 
                            marginBottom: '8px', 
                            fontSize: '13.5px', 
                            color: 'var(--text-secondary)',
                            lineHeight: '1.6',
                            paddingLeft: '4px'
                        }}
                    >
                        <span style={{ color: '#1abc9c', fontWeight: 'bold', fontSize: '15px', lineHeight: '1' }}>•</span>
                        <span dangerouslySetInnerHTML={{ __html: cleanBold(listText) }} />
                    </div>
                );
            }

            // 4. Divider Line (---)
            if (trimmed === '---') {
                return (
                    <hr 
                        key={i} 
                        style={{ 
                            border: 'none', 
                            borderTop: '1px solid var(--glass-border)', 
                            margin: '20px 0' 
                        }} 
                    />
                );
            }

            // 5. Standard Paragraph
            return (
                <p 
                    key={i} 
                    style={{ 
                        fontSize: '13.5px', 
                        lineHeight: '1.6', 
                        color: 'var(--text-secondary)', 
                        margin: '0 0 8px 0' 
                    }} 
                    dangerouslySetInnerHTML={{ __html: cleanBold(trimmed) }} 
                />
            );
        });
    };

    return (
        <div className={styles.card} style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(26, 188, 156, 0.1) 0%, rgba(15, 18, 24, 0.8) 100%)', border: '1px solid rgba(26, 188, 156, 0.3)' }}>
            <div className={styles.cardHeader} onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '10px', background: 'rgba(26, 188, 156, 0.2)', borderRadius: '12px' }}>
                        <Bot size={24} color="#1abc9c" />
                    </div>
                    <div>
                        <h3 className={styles.cardTitle}>AI Dietary Advisor</h3>
                        <p className={styles.cardValue} style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Personalized food recommendations</p>
                    </div>
                </div>
                {expanded ? <ChevronUp size={24} color="var(--text-secondary)" /> : <ChevronDown size={24} color="var(--text-secondary)" />}
            </div>

            {(expanded || !recommendation) && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>

                    {!recommendation && (
                        <div style={{ background: 'rgba(231, 76, 60, 0.1)', padding: '12px', borderRadius: '8px', display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-start' }}>
                            <AlertTriangle size={20} color="#e74c3c" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ fontSize: '13px', color: '#e74c3c', margin: 0, lineHeight: '1.5' }}>
                                <strong>Medical Disclaimer:</strong> This tool uses AI to provide general dietary suggestions. It is not a substitute for professional medical advice. Always consult your doctor or dietitian before making significant changes to your diet, especially if you have known medical conditions like diabetes or heart disease.
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'block', marginBottom: '12px' }}>
                                Select one or more medical conditions to analyze:
                            </label>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {AVAILABLE_CONDITIONS.map(c => {
                                    const isSelected = selectedConditions.includes(c.id);
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => toggleCondition(c.id)}
                                            style={{
                                                padding: '10px 16px',
                                                borderRadius: '20px',
                                                border: isSelected ? `2px solid ${c.color}` : '1px solid var(--glass-border)',
                                                background: isSelected ? `rgba(${parseInt(c.color.slice(1,3),16)}, ${parseInt(c.color.slice(3,5),16)}, ${parseInt(c.color.slice(5,7),16)}, 0.2)` : 'rgba(15, 18, 24, 0.6)',
                                                color: isSelected ? '#white' : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                fontSize: '13px',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <span style={{ 
                                                width: '8px', 
                                                height: '8px', 
                                                borderRadius: '50%', 
                                                background: c.color,
                                                display: 'inline-block' 
                                            }} />
                                            {c.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Biometric Telemetry Overrides */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: '16px',
                            background: 'rgba(15, 18, 24, 0.4)',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid var(--glass-border)',
                            marginTop: '10px'
                        }}>
                            {/* Gender */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px' }}>GENDER</label>
                                <select 
                                    value={gender} 
                                    onChange={(e) => {
                                        setGender(e.target.value);
                                        updateProfile({ gender: e.target.value });
                                    }}
                                    style={{
                                        background: 'rgba(15, 18, 24, 0.8)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        color: '#fff',
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>

                            {/* Age */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px' }}>AGE (YEARS)</label>
                                <input 
                                    type="number" 
                                    value={age} 
                                    onChange={(e) => {
                                        setAge(e.target.value);
                                        const newAge = parseInt(e.target.value);
                                        if (!isNaN(newAge)) {
                                            const birthYear = new Date().getFullYear() - newAge;
                                            updateProfile({ dob: `${birthYear}-01-01` });
                                        }
                                    }}
                                    style={{
                                        background: 'rgba(15, 18, 24, 0.8)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        color: '#fff',
                                        fontSize: '13px'
                                    }}
                                />
                            </div>

                            {/* Weight */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px' }}>WEIGHT (KG)</label>
                                <input 
                                    type="number" 
                                    value={weight} 
                                    onChange={(e) => {
                                        setWeight(e.target.value);
                                        updateProfile({ weight: e.target.value });
                                    }}
                                    style={{
                                        background: 'rgba(15, 18, 24, 0.8)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        color: '#fff',
                                        fontSize: '13px'
                                    }}
                                />
                            </div>

                            {/* Height */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px' }}>HEIGHT (CM)</label>
                                <input 
                                    type="number" 
                                    value={height} 
                                    onChange={(e) => {
                                        setHeight(e.target.value);
                                        updateProfile({ height: e.target.value });
                                    }}
                                    style={{
                                        background: 'rgba(15, 18, 24, 0.8)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        color: '#fff',
                                        fontSize: '13px'
                                    }}
                                />
                            </div>

                            {/* Goal */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px' }}>FITNESS GOAL</label>
                                <select 
                                    value={goal} 
                                    onChange={(e) => {
                                        setGoal(e.target.value);
                                        updateProfile({ goal: e.target.value });
                                    }}
                                    style={{
                                        background: 'rgba(15, 18, 24, 0.8)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        color: '#fff',
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="maintain">Weight Maintain</option>
                                    <option value="weight_loss">Weight Loss</option>
                                    <option value="weight_gain">Weight Gain</option>
                                </select>
                            </div>
                        </div>

                        {error && <p style={{ color: '#e74c3c', fontSize: '14px', margin: 0 }}>{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                background: loading ? 'var(--text-secondary)' : '#1abc9c',
                                color: loading ? '#fff' : '#0F1218',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {loading ? 'Analyzing with AI...' : (recommendation ? 'Regenerate Plan' : 'Generate Dietary Plan')}
                            <Activity size={18} />
                        </button>
                    </form>

                    {recommendation && (
                        <div style={{
                            marginTop: '24px',
                            padding: '20px',
                            background: 'rgba(15, 18, 24, 0.4)',
                            borderRadius: '12px',
                            border: '1px solid var(--glass-border)',
                        }}>
                            <h4 style={{ color: '#1abc9c', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Bot size={20} /> Your AI Dietary Plan
                            </h4>
                            <div style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                                {formatMarkdown(recommendation)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DietaryAdvisor;
