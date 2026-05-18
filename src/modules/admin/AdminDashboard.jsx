import React, { useState, useEffect, useRef } from 'react';
import { 
    Shield, Users, Activity, Eye, EyeOff, Trash2, Ban, ShieldAlert,
    TrendingUp, Bell, HardDrive, Terminal, FileText, Server, AlertCircle,
    Plus, Check, X, RefreshCw, Layers, Lock, Unlock, Play, Cpu
} from 'lucide-react';

const AdminDashboard = () => {
    // Tab Management: 'telemetry' | 'users' | 'kbes' | 'moderation' | 'logs'
    const [activeTab, setActiveTab] = useState('telemetry');

    // Live Metrics (simulated real-time ticker)
    const [apiLatency, setApiLatency] = useState(42);
    const [activeUsersCount, setActiveUsersCount] = useState(148);
    const [errorRate, setErrorRate] = useState(0.04);
    const [cpuLoad, setCpuLoad] = useState(24);

    // KBES Medical Recommendation Rules State
    const [kbesRules, setKbesRules] = useState([
        { id: 1, trigger: "Steps < 3,000", advice: "Sedentary alert. Suggest a light 20-min evening walk to boost resting metabolic rate.", category: "Cardiology", severity: "Medium" },
        { id: 2, trigger: "Sleep < 5.5 hours", advice: "Deep sleep deprivation. Restrict screen time 1 hr before bed and suggest magnesium intake.", category: "Neurology", severity: "High" },
        { id: 3, trigger: "Calorie Intake > 3,200 kcal", advice: "Elevated calorie load. Recommend balanced dietary fibers and complex carbs.", category: "Nutrition", severity: "Low" },
        { id: 4, trigger: "Budget deficit > 25%", advice: "High discretionary spending. Trigger auto-saving envelope lockdown mode.", category: "Finance", severity: "Medium" }
    ]);
    const [newRuleTrigger, setNewRuleTrigger] = useState('');
    const [newRuleAdvice, setNewRuleAdvice] = useState('');
    const [newRuleCategory, setNewRuleCategory] = useState('Nutrition');
    const [newRuleSeverity, setNewRuleSeverity] = useState('Low');
    const [editingRuleId, setEditingRuleId] = useState(null);

    // Dynamic User Management State
    const [usersList, setUsersList] = useState([
        { uid: "usr_101", phone: "+91 99999 88888", name: "Amjad Khan", status: "Active", role: "Super Admin", joins: "2026-02-12" },
        { uid: "usr_102", phone: "+91 98765 43210", name: "John Cooper", status: "Active", role: "Parent", joins: "2026-03-01" },
        { uid: "usr_103", phone: "+91 88888 77777", name: "Emma Watson", status: "Suspended", role: "Member", joins: "2026-03-10" },
        { uid: "usr_104", phone: "+91 77777 66666", name: "Danny Boy", status: "Active", role: "Child", joins: "2026-04-15" },
        { uid: "usr_105", phone: "+91 90000 11111", name: "Suspect Spambot", status: "Banned", role: "Member", joins: "2026-05-01" }
    ]);

    // Moderation Inbox State
    const [moderationReports, setModerationReports] = useState([
        { id: 101, reportedUser: "Suspect Spambot", reporter: "Emma Watson", type: "Abuse / Spam", desc: "Automated crypto advertising messages in family hub feed.", status: "Pending Action" },
        { id: 102, reportedUser: "John Cooper", reporter: "Danny Boy", type: "Health Misinformation", desc: "Shared unverified nutritional remedy containing toxic compounds.", status: "Pending Action" },
        { id: 103, reportedUser: "Emma Watson", reporter: "Amjad Khan", type: "Fake Account", desc: "Secondary account registered with simulated phone simulator.", status: "Resolved" }
    ]);

    // Command terminal simulation logs
    const [terminalLogs, setTerminalLogs] = useState([
        "🚀 [SYSTEM] Unify Security & Compliance Core Initialized successfully.",
        "🔒 [SECURITY] SSL/TLS Certificate check: VALID (Expires in 284 days).",
        "📂 [DB] Rehydrated 14 users, 5 active families.",
        "📡 [API] GET /health/advisor response 200 OK in 12ms",
        "🛡️ [AUDIT] Super Admin Amjad Khan signed in."
    ]);

    // Auto-scroll for the terminal component
    const terminalEndRef = useRef(null);
    useEffect(() => {
        if (terminalEndRef.current) {
            terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [terminalLogs]);

    // Simulated real-time metrics engine
    useEffect(() => {
        const interval = setInterval(() => {
            // Ticker latency
            setApiLatency(prev => Math.max(25, Math.min(120, prev + Math.floor(Math.random() * 15) - 7)));
            
            // Randomly update active users
            setActiveUsersCount(prev => Math.max(120, Math.min(220, prev + Math.floor(Math.random() * 5) - 2)));
            
            // Slight CPU changes
            setCpuLoad(prev => Math.max(10, Math.min(85, prev + Math.floor(Math.random() * 11) - 5)));

            // Add simulated system logs
            const mockEvents = [
                `📡 [API] GET /health/advisor response 200 OK - ${Math.floor(Math.random() * 50) + 10}ms`,
                `📂 [DB] Merged user doc for uid usr_${Math.floor(Math.random() * 5) + 101}`,
                `🔒 [SECURITY] Blocked brute force probe from IP 182.${Math.floor(Math.random() * 200) + 50}.44.12`,
                `🛡️ [KBES] Medical recommendations recalculated for active family hubs.`,
                `📡 [API] POST /auth/login status 201 Created`
            ];
            const randomLog = mockEvents[Math.floor(Math.random() * mockEvents.length)];
            setTerminalLogs(prev => [...prev.slice(-30), randomLog]); // Keep max 30 logs
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    // KBES Rule operations
    const handleAddRule = (e) => {
        e.preventDefault();
        if (!newRuleTrigger || !newRuleAdvice) return;

        if (editingRuleId) {
            // Edit Mode
            setKbesRules(prev => prev.map(rule => {
                if (rule.id === editingRuleId) {
                    return { ...rule, trigger: newRuleTrigger, advice: newRuleAdvice, category: newRuleCategory, severity: newRuleSeverity };
                }
                return rule;
            }));
            setEditingRuleId(null);
            alert("✅ Rule updated successfully!");
        } else {
            // Create Mode
            const newRule = {
                id: Date.now(),
                trigger: newRuleTrigger,
                advice: newRuleAdvice,
                category: newRuleCategory,
                severity: newRuleSeverity
            };
            setKbesRules(prev => [...prev, newRule]);
            alert("✅ KBES Medical Rule added successfully!");
        }

        setNewRuleTrigger('');
        setNewRuleAdvice('');
    };

    const handleEditRule = (rule) => {
        setEditingRuleId(rule.id);
        setNewRuleTrigger(rule.trigger);
        setNewRuleAdvice(rule.advice);
        setNewRuleCategory(rule.category);
        setNewRuleSeverity(rule.severity);
    };

    const handleDeleteRule = (id) => {
        if (window.confirm("Delete this rule from the KBES expert engine?")) {
            setKbesRules(prev => prev.filter(r => r.id !== id));
        }
    };

    // User actions
    const handleUserStatus = (uid, action) => {
        setUsersList(prev => prev.map(usr => {
            if (usr.uid === uid) {
                return { ...usr, status: action };
            }
            return usr;
        }));
        alert(`User status updated to ${action}!`);
    };

    const handleDeleteUser = (uid) => {
        if (window.confirm("⚠️ permanent deletion of this account is irreversible! Are you sure?")) {
            setUsersList(prev => prev.filter(usr => usr.uid !== uid));
        }
    };

    // Moderation action
    const handleResolveReport = (id, action) => {
        setModerationReports(prev => prev.map(rep => {
            if (rep.id === id) {
                return { ...rep, status: action };
            }
            return rep;
        }));
        alert(`Moderation Case #${id} updated: ${action}`);
    };

    return (
        <div style={{ paddingBottom: '60px' }}>
            {/* Header Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 6px 0', background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Command Center & Central Admin
                    </h1>
                    <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                        Monitor server latency, manage users, modify clinical rules, and check security logs.
                    </p>
                </div>
            </div>

            {/* Dashboard Telemetry Panel Cards */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px', marginBottom: '30px'
            }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(255,255,255,0.06)', padding: '20px', borderRadius: '16px', backdropFilter: 'blur(12px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase' }}>API Response Latency</span>
                        <Server size={18} color="#38bdf8" />
                    </div>
                    <strong style={{ fontSize: '28px', color: '#38bdf8' }}>{apiLatency}ms</strong>
                    <div style={{ fontSize: '11px', color: '#34d399', marginTop: '6px' }}>⚡ Extreme High Speed (Healthy)</div>
                </div>

                <div style={{ background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(255,255,255,0.06)', padding: '20px', borderRadius: '16px', backdropFilter: 'blur(12px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase' }}>Active Telemetry Feeds</span>
                        <Users size={18} color="#c084fc" />
                    </div>
                    <strong style={{ fontSize: '28px', color: '#c084fc' }}>{activeUsersCount}</strong>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>Syncing wearable channels</div>
                </div>

                <div style={{ background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(255,255,255,0.06)', padding: '20px', borderRadius: '16px', backdropFilter: 'blur(12px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase' }}>CPU Load Core</span>
                        <Cpu size={18} color="#f87171" />
                    </div>
                    <strong style={{ fontSize: '28px', color: '#f87171' }}>{cpuLoad}%</strong>
                    <div style={{
                        width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)',
                        borderRadius: '2px', overflow: 'hidden', marginTop: '10px'
                    }}>
                        <div style={{ width: `${cpuLoad}%`, height: '100%', background: '#f87171', transition: 'width 0.4s' }} />
                    </div>
                </div>

                <div style={{ background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(255,255,255,0.06)', padding: '20px', borderRadius: '16px', backdropFilter: 'blur(12px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase' }}>API Error Threshold</span>
                        <AlertCircle size={18} color="#fbbf24" />
                    </div>
                    <strong style={{ fontSize: '28px', color: '#fbbf24' }}>{(errorRate * 100).toFixed(2)}%</strong>
                    <div style={{ fontSize: '11px', color: '#34d399', marginTop: '6px' }}>✓ Well below SLA limits</div>
                </div>
            </div>

            {/* Admin Tab Controller Navigation Bar */}
            <div style={{
                display: 'flex', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px',
                padding: '6px', gap: '6px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <button 
                    onClick={() => setActiveTab('telemetry')}
                    style={{
                        flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                        border: 'none', fontWeight: '600', fontSize: '13px',
                        background: activeTab === 'telemetry' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                        color: activeTab === 'telemetry' ? '#38bdf8' : 'rgba(255,255,255,0.6)'
                    }}
                >
                    API & Systems Health
                </button>
                <button 
                    onClick={() => setActiveTab('users')}
                    style={{
                        flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                        border: 'none', fontWeight: '600', fontSize: '13px',
                        background: activeTab === 'users' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                        color: activeTab === 'users' ? '#c084fc' : 'rgba(255,255,255,0.6)'
                    }}
                >
                    Accounts Control
                </button>
                <button 
                    onClick={() => setActiveTab('kbes')}
                    style={{
                        flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                        border: 'none', fontWeight: '600', fontSize: '13px',
                        background: activeTab === 'kbes' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                        color: activeTab === 'kbes' ? '#34d399' : 'rgba(255,255,255,0.6)'
                    }}
                >
                    KBES Medical Rules
                </button>
                <button 
                    onClick={() => setActiveTab('moderation')}
                    style={{
                        flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                        border: 'none', fontWeight: '600', fontSize: '13px',
                        background: activeTab === 'moderation' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                        color: activeTab === 'moderation' ? '#f87171' : 'rgba(255,255,255,0.6)'
                    }}
                >
                    Moderation Inbox
                </button>
            </div>

            {/* Systems Telemetry and live Command logs tab */}
            {activeTab === 'telemetry' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '30px' }}>
                    {/* Live Server Terminal Logs */}
                    <div style={{
                        background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.2)',
                        borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column',
                        justifyContent: 'space-between', height: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Terminal size={18} color="#38bdf8" />
                                <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'white' }}>root@unify_security_audit_terminal:~</span>
                            </div>
                            <span style={{ fontSize: '10px', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: '4px' }}>LIVE STREAMING</span>
                        </div>

                        {/* Logs body */}
                        <div style={{
                            flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px',
                            color: '#34D399', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '6px'
                        }}>
                            {terminalLogs.map((log, index) => {
                                let logColor = '#34D399'; // Default Green
                                if (log.includes("[SECURITY]")) logColor = '#f87171'; // Red
                                if (log.includes("[KBES]")) logColor = '#c084fc'; // Purple
                                return (
                                    <div key={index} style={{ color: logColor }}>
                                        {log}
                                    </div>
                                );
                            })}
                            <div ref={terminalEndRef} />
                        </div>
                    </div>

                    {/* Database summary panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(255,255,255,0.06)', padding: '24px', borderRadius: '20px', backdropFilter: 'blur(12px)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <HardDrive size={18} color="#c084fc" /> Database Metrics
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Firestore Collections</span>
                                    <strong style={{ color: 'white' }}>4 Core</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Total Registered Hubs</span>
                                    <strong style={{ color: 'white' }}>18 Families</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Active Integrations</span>
                                    <strong style={{ color: '#c084fc' }}>32 APIs</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Server Status</span>
                                    <strong style={{ color: '#34d399' }}>100% Operational</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Accounts Control and Management tab */}
            {activeTab === 'users' && (
                <div style={{
                    background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '24px', padding: '30px'
                }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: '0 0 16px 0' }}>
                        User Accounts Control Panel
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', color: 'white', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}>
                                    <th style={{ padding: '12px 8px' }}>Name / UID</th>
                                    <th style={{ padding: '12px 8px' }}>Mobile Number</th>
                                    <th style={{ padding: '12px 8px' }}>Role</th>
                                    <th style={{ padding: '12px 8px' }}>Created At</th>
                                    <th style={{ padding: '12px 8px' }}>Status</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersList.map((user) => (
                                    <tr key={user.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px 8px' }}>
                                            <strong style={{ display: 'block' }}>{user.name}</strong>
                                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{user.uid}</span>
                                        </td>
                                        <td style={{ padding: '16px 8px', fontFamily: 'monospace' }}>{user.phone}</td>
                                        <td style={{ padding: '16px 8px' }}>{user.role}</td>
                                        <td style={{ padding: '16px 8px', color: 'rgba(255,255,255,0.5)' }}>{user.joins}</td>
                                        <td style={{ padding: '16px 8px' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
                                                background: user.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : user.status === 'Suspended' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                color: user.status === 'Active' ? '#34D399' : user.status === 'Suspended' ? '#FBBF24' : '#F87171'
                                            }}>{user.status}</span>
                                        </td>
                                        <td style={{ padding: '16px 8px' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                {user.status === 'Active' ? (
                                                    <button 
                                                        onClick={() => handleUserStatus(user.uid, 'Suspended')}
                                                        title="Suspend Account"
                                                        style={{ background: 'rgba(245,158,11,0.15)', border: 'none', padding: '6px', borderRadius: '6px', color: '#FBBF24', cursor: 'pointer' }}
                                                    >
                                                        <EyeOff size={16} />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleUserStatus(user.uid, 'Active')}
                                                        title="Activate Account"
                                                        style={{ background: 'rgba(16,185,129,0.15)', border: 'none', padding: '6px', borderRadius: '6px', color: '#34D399', cursor: 'pointer' }}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleUserStatus(user.uid, 'Banned')}
                                                    title="Ban User Profile"
                                                    style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', padding: '6px', borderRadius: '6px', color: '#F87171', cursor: 'pointer' }}
                                                >
                                                    <Ban size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(user.uid)}
                                                    title="Irreversibly Delete Account"
                                                    style={{ background: 'rgba(239, 68, 68, 0.25)', border: 'none', padding: '6px', borderRadius: '6px', color: '#F87171', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* KBES Knowledge-Based Medical Rules Engine tab */}
            {activeTab === 'kbes' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                    
                    {/* Rules List */}
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '24px', padding: '30px'
                    }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Layers size={22} color="#34d399" /> KBES Clinical recommendation rules
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {kbesRules.map((rule) => (
                                <div key={rule.id} style={{
                                    background: 'rgba(15, 23, 42, 0.4)', padding: '20px', borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between',
                                    gap: '20px'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '2px 6px', borderRadius: '4px' }}>{rule.category}</span>
                                            <span style={{
                                                fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: '600',
                                                background: rule.severity === 'High' ? 'rgba(239, 68, 68, 0.15)' : rule.severity === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                                color: rule.severity === 'High' ? '#F87171' : rule.severity === 'Medium' ? '#FBBF24' : '#34D399'
                                            }}>{rule.severity} Priority</span>
                                        </div>
                                        <strong style={{ fontSize: '15px', color: 'white', display: 'block', marginBottom: '4px' }}>Trigger: {rule.trigger}</strong>
                                        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4' }}>{rule.advice}</p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <button 
                                            onClick={() => handleEditRule(rule)}
                                            style={{
                                                background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white',
                                                padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteRule(rule.id)}
                                            style={{
                                                background: 'rgba(239,68,68,0.15)', border: 'none', color: '#F87171',
                                                padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rule Editor Form */}
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '20px', padding: '24px', height: 'fit-content'
                    }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'white', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Plus size={18} color="#34d399" /> {editingRuleId ? "Modify Medical Rule" : "Add Clinical Rule"}
                        </h4>
                        <form onSubmit={handleAddRule}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Trigger Condition</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Heart Rate > 120"
                                    value={newRuleTrigger}
                                    onChange={(e) => setNewRuleTrigger(e.target.value)}
                                    style={{
                                        width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)',
                                        padding: '10px 12px', borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box'
                                    }}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Recommendation Advice</label>
                                <textarea 
                                    placeholder="Enter physical guidance or diet limits..."
                                    value={newRuleAdvice}
                                    onChange={(e) => setNewRuleAdvice(e.target.value)}
                                    style={{
                                        width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)',
                                        padding: '10px 12px', borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box',
                                        minHeight: '80px', resize: 'vertical'
                                    }}
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Category</label>
                                    <select 
                                        value={newRuleCategory}
                                        onChange={(e) => setNewRuleCategory(e.target.value)}
                                        style={{
                                            width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)',
                                            padding: '10px', borderRadius: '8px', color: 'white'
                                        }}
                                    >
                                        <option value="Nutrition">Nutrition</option>
                                        <option value="Cardiology">Cardiology</option>
                                        <option value="Neurology">Neurology</option>
                                        <option value="Finance">Finance</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Priority</label>
                                    <select 
                                        value={newRuleSeverity}
                                        onChange={(e) => setNewRuleSeverity(e.target.value)}
                                        style={{
                                            width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)',
                                            padding: '10px', borderRadius: '8px', color: 'white'
                                        }}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" style={{
                                width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none', color: 'white', padding: '12px', borderRadius: '8px',
                                fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
                            }}>
                                {editingRuleId ? "Save Modifications" : "Inject Rules Engine"}
                            </button>
                            {editingRuleId && (
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setEditingRuleId(null);
                                        setNewRuleTrigger('');
                                        setNewRuleAdvice('');
                                    }}
                                    style={{
                                        width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                                        color: 'white', padding: '8px', borderRadius: '8px', cursor: 'pointer',
                                        fontSize: '12px', marginTop: '10px'
                                    }}
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Moderation Inbox and Reports tab */}
            {activeTab === 'moderation' && (
                <div style={{
                    background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '24px', padding: '30px'
                }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldAlert size={22} color="#f87171" /> Content Moderation Reports
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {moderationReports.map((rep) => (
                            <div key={rep.id} style={{
                                background: 'rgba(15, 23, 42, 0.4)', padding: '20px', borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between',
                                flexWrap: 'wrap', gap: '20px', alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>#{rep.id}</span>
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Reported Category: <strong>{rep.type}</strong></span>
                                        <span style={{
                                            fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: '600',
                                            background: rep.status === 'Resolved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                            color: rep.status === 'Resolved' ? '#34D399' : '#FBBF24'
                                        }}>{rep.status}</span>
                                    </div>
                                    <div style={{ fontSize: '14px', color: 'white', marginBottom: '4px' }}>
                                        Account flagged: <strong style={{ color: '#f87171' }}>{rep.reportedUser}</strong> • Reported by: <strong>{rep.reporter}</strong>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4' }}>{rep.desc}</p>
                                </div>

                                {rep.status !== 'Resolved' && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            onClick={() => handleResolveReport(rep.id, 'Resolved')}
                                            style={{
                                                background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                                                color: '#34D399', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer',
                                                fontWeight: '600', fontSize: '12px'
                                            }}
                                        >
                                            Approve Action
                                        </button>
                                        <button 
                                            onClick={() => handleResolveReport(rep.id, 'Dismissed')}
                                            style={{
                                                background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                                                color: 'rgba(255,255,255,0.6)', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            Dismiss Case
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
