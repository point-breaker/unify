import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, Check, Crown, CreditCard, Shield, Activity, Watch, User, Scale, Ruler, HeartPulse, Apple, Calendar, Copy, LogOut } from 'lucide-react';
import { useHealth } from '../contexts/HealthContext';
import { useFamily } from '../contexts/FamilyContext';

const Settings = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { healthState, updateProfile } = useHealth();
    const { profile } = healthState;
    const { familyState, upgradeToFamily, joinFamily, leaveFamily, toggleSharing } = useFamily();
    const [joinCode, setJoinCode] = useState('');

    // Tab State
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'general'

    // Form State (initialized from context)
    const [formData, setFormData] = useState({
        height: profile?.height || '',
        weight: profile?.weight || '',
        gender: profile?.gender || 'male',
        dob: profile?.dob || '',
        goal: profile?.goal || 'maintain',
        conditions: profile?.conditions || ''
    });

    // General Settings State
    const [members, setMembers] = useState(4);

    // Pricing Logic
    const tierIndex = Math.ceil(members / 6);
    const price = tierIndex * 10;
    const tierName = members <= 6 ? "Standard Family" : members <= 12 ? "Extended Family" : "Community Clan";

    const handleSaveProfile = () => {
        updateProfile(formData);
        alert("Profile successfully saved! Personalized recommendations updated.");
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: 40 }}>
            {/* Header */}
            <div style={{ marginBottom: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Settings</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage preferences and health profile.</p>
                </div>
                {/* Tab Switcher */}
                <div style={{ background: 'var(--bg-card)', padding: 4, borderRadius: 12, display: 'flex', border: '1px solid var(--glass-border)' }}>
                    <button
                        onClick={() => setActiveTab('profile')}
                        style={{
                            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: activeTab === 'profile' ? 'var(--accent)' : 'transparent',
                            color: activeTab === 'profile' ? 'white' : 'var(--text-secondary)',
                            fontWeight: 500
                        }}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('general')}
                        style={{
                            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: activeTab === 'general' ? 'var(--accent)' : 'transparent',
                            color: activeTab === 'general' ? 'white' : 'var(--text-secondary)',
                            fontWeight: 500
                        }}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('subscription')}
                        style={{
                            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: activeTab === 'subscription' ? 'var(--accent)' : 'transparent',
                            color: activeTab === 'subscription' ? 'white' : 'var(--text-secondary)',
                            fontWeight: 500
                        }}
                    >
                        Subscription
                    </button>
                </div>
            </div>

            {activeTab === 'profile' ? (
                /* PROFILE TAB */
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '24px',
                        padding: '32px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={24} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 600 }}>Personal Details</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Used to calculate caloric needs and meal plans.</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                            {/* Height */}
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Height (cm)</label>
                                <div style={{ position: 'relative' }}>
                                    <Ruler size={16} style={{ position: 'absolute', left: 12, top: 12, opacity: 0.5 }} />
                                    <input
                                        type="number"
                                        name="height"
                                        value={formData.height}
                                        onChange={handleChange}
                                        placeholder="175"
                                        style={{ width: '100%', padding: '10px 10px 10px 36px', background: 'rgba(255,255,255,0.03)', border: '1px solid #444', borderRadius: 8, color: 'white' }}
                                    />
                                </div>
                            </div>
                            {/* Weight */}
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Weight (kg)</label>
                                <div style={{ position: 'relative' }}>
                                    <Scale size={16} style={{ position: 'absolute', left: 12, top: 12, opacity: 0.5 }} />
                                    <input
                                        type="number"
                                        name="weight"
                                        value={formData.weight}
                                        onChange={handleChange}
                                        placeholder="70"
                                        style={{ width: '100%', padding: '10px 10px 10px 36px', background: 'rgba(255,255,255,0.03)', border: '1px solid #444', borderRadius: 8, color: 'white' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Date of Birth</label>
                            <div style={{ position: 'relative' }}>
                                <Calendar size={16} style={{ position: 'absolute', left: 12, top: 12, opacity: 0.5 }} />
                                <input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '10px 10px 10px 36px', background: 'rgba(255,255,255,0.03)', border: '1px solid #444', borderRadius: 8, color: 'white', fontFamily: 'inherit' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                            {/* Gender */}
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Gender</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid #444', borderRadius: 8, color: 'white' }}
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            {/* Goal */}
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Weight Goal</label>
                                <select
                                    name="goal"
                                    value={formData.goal}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid #444', borderRadius: 8, color: 'white' }}
                                >
                                    <option value="lose">Lose Weight</option>
                                    <option value="maintain">Maintain Weight</option>
                                    <option value="gain">Gain Muscle/Weight</option>
                                </select>
                            </div>
                        </div>

                        {/* Illnesses */}
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Health Conditions / Illnesses</label>
                            <div style={{ position: 'relative' }}>
                                <HeartPulse size={16} style={{ position: 'absolute', left: 12, top: 12, opacity: 0.5 }} />
                                <input
                                    type="text"
                                    name="conditions"
                                    value={formData.conditions}
                                    onChange={handleChange}
                                    placeholder="e.g. Diabetes, Hypertension, Gluten Intolerance (Separate by comma)"
                                    style={{ width: '100%', padding: '10px 10px 10px 36px', background: 'rgba(255,255,255,0.03)', border: '1px solid #444', borderRadius: 8, color: 'white' }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSaveProfile}
                            style={{ width: '100%', padding: 14, background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                            <Check size={18} /> Save Profile
                        </button>

                        <button
                            onClick={async () => {
                                if (window.confirm("Are you sure you want to log out of your Unify account?")) {
                                    await logout();
                                    navigate('/login');
                                }
                            }}
                            style={{ 
                                marginTop: 16, 
                                width: '100%', 
                                padding: 14, 
                                background: 'rgba(239, 68, 68, 0.08)', 
                                border: '1px solid rgba(239, 68, 68, 0.25)', 
                                color: '#EF4444', 
                                borderRadius: 12, 
                                fontWeight: 600, 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: 8,
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                                e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.25)';
                            }}
                        >
                            <LogOut size={18} /> Log Out of Account
                        </button>
                    </div>
                </div>
            ) : (
                /* GENERAL TAB */
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    {/* Subscription Card */}


                    {/* Fitness Tracker Connection */}
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '24px',
                        padding: '32px',
                        marginBottom: '24px'
                    }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '12px',
                                background: 'rgba(16, 185, 129, 0.1)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', color: 'var(--success)'
                            }}>
                                <Activity size={24} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Health Devices</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                    Connect wearables for better AI recommendations.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Watch size={20} color="#fff" />
                                <span>Bluetooth Heart Rate Monitor</span>
                            </div>
                            <button
                                onClick={() => alert("Please go to the Health Dashboard to initiate the live connection visualization.")}
                                style={{
                                    background: 'var(--bg-app)', border: '1px solid var(--glass-border)',
                                    color: 'var(--info)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer'
                                }}
                            >
                                Connect
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'subscription' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    {/* Active Subscription View */}
                    {familyState.subscription.status === 'premium' ? (
                        <div style={{
                            background: 'linear-gradient(145deg, rgba(20, 25, 35, 0.9) 0%, rgba(10, 12, 16, 0.95) 100%)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '24px',
                            padding: '32px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute', top: 0, right: 0, padding: '8px 16px',
                                background: 'var(--success)', borderBottomLeftRadius: '16px',
                                fontSize: '12px', fontWeight: 700, color: 'black'
                            }}>
                                ACTIVE
                            </div>

                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: '12px',
                                    background: 'rgba(16, 185, 129, 0.1)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', color: 'var(--success)'
                                }}>
                                    <Crown size={24} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: 600 }}>{familyState.subscription.tier}</h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                        {familyState.role === 'admin' ? 'You are the Admin of this family.' : `Member of ${familyState.members[0]?.name}'s Family.`}
                                    </p>
                                </div>
                            </div>

                            {/* Admin: Show Code */}
                            {familyState.role === 'admin' && (
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 24, borderRadius: 16, marginBottom: 24 }}>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Family Code</div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{
                                            flex: 1, background: 'black', border: '1px solid var(--glass-border)',
                                            borderRadius: 8, padding: '12px', fontFamily: 'monospace', fontSize: 20,
                                            letterSpacing: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--accent)'
                                        }}>
                                            {familyState.familyCode}
                                        </div>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(familyState.familyCode)}
                                            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                                        >
                                            <Copy size={20} />
                                        </button>
                                    </div>
                                    <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        Share this code with your family members. They can enter it in their Settings &gt; Subscription tab to join your plan.
                                    </p>
                                </div>
                            )}

                            {/* Members List */}
                            <div style={{ marginTop: 24 }}>
                                <h3 style={{ fontSize: 16, marginBottom: 16 }}>Family Members ({familyState.members.length})</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {familyState.members.map((member, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--grad-community)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                                                {member.name.charAt(0)}
                                            </div>
                                            <span>{member.name}</span>
                                            {i === 0 && <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--accent)', borderRadius: 4 }}>ADMIN</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                    <Shield size={16} color="var(--info)" />
                                    <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Privacy & Sharing</h3>
                                </div>

                                {familyState.members.find(m => m.id === (familyState.role === 'admin' ? 'admin' : 'userself')) && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {/* Health Toggle */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Share Health Data</span>
                                            <button
                                                onClick={() => toggleSharing('health')}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: familyState.members.find(m => m.id === (familyState.role === 'admin' ? 'admin' : 'userself')).permissions?.health ? 'var(--success)' : 'var(--text-muted)' }}
                                            >
                                                {familyState.members.find(m => m.id === (familyState.role === 'admin' ? 'admin' : 'userself')).permissions?.health ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                            </button>
                                        </div>
                                        {/* Finance Toggle */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Share Finance Data</span>
                                            <button
                                                onClick={() => toggleSharing('finance')}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: familyState.members.find(m => m.id === (familyState.role === 'admin' ? 'admin' : 'userself')).permissions?.finance ? 'var(--success)' : 'var(--text-muted)' }}
                                            >
                                                {familyState.members.find(m => m.id === (familyState.role === 'admin' ? 'admin' : 'userself')).permissions?.finance ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={leaveFamily}
                                style={{
                                    marginTop: 32, width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #EF4444',
                                    background: 'transparent', color: '#EF4444', fontWeight: 600,
                                    fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                }}
                            >
                                <LogOut size={16} /> {familyState.role === 'admin' ? 'Cancel Subscription' : 'Leave Family'}
                            </button>
                        </div>
                    ) : (
                        /* Unsubscribed View: Pricing + Join */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Pricing Card (Re-used) */}
                            <div style={{
                                background: 'linear-gradient(145deg, rgba(20, 25, 35, 0.9) 0%, rgba(10, 12, 16, 0.95) 100%)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '24px',
                                padding: '32px',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                                        <Crown size={24} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Unify Family Plan</h2>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>One subscription for the whole family.</p>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Family Size</span>
                                        <span style={{ color: 'var(--info)', fontWeight: 700 }}>{members} Members</span>
                                    </div>
                                    <input type="range" min="1" max="24" value={members} onChange={(e) => setMembers(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--info)', cursor: 'pointer', marginBottom: '12px' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        <span>1 Member</span>
                                        <span>12 Members</span>
                                        <span>24 Members</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Your Plan Tier</div>
                                        <div style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>{tierName}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>${price}<span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => upgradeToFamily(tierName)}
                                    style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: 'var(--grad-community)', color: 'white', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }}
                                >
                                    Upgrade & Get Admin Code
                                </button>
                            </div>

                            {/* Connect to Existing Family */}
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '32px' }}>
                                <h3 style={{ fontSize: 18, marginBottom: 8 }}>Have a Family Code?</h3>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Enter the unique code shared by your family admin.</p>

                                <div style={{ display: 'flex', gap: 12 }}>
                                    <input
                                        type="text"
                                        placeholder="e.g. A9B!2X..."
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                        style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid #444', borderRadius: 8, color: 'white', fontFamily: 'monospace' }}
                                    />
                                    <button
                                        onClick={() => {
                                            const res = joinFamily(joinCode);
                                            alert(res.message);
                                        }}
                                        style={{ padding: '0 24px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Join
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Settings;
