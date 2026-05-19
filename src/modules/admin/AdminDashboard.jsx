import React, { useState, useEffect } from 'react';
import { 
    Shield, Users, ShieldAlert,
    HardDrive, Check, X, Layers, AlertCircle, Plus, Trash2
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';

const AdminDashboard = () => {
    const { familyState, removeMember, updateMemberRole, updateFamilyRules, markNotificationsRead } = useFamily();
    const [activeTab, setActiveTab] = useState('telemetry');

    // Safe extraction of rules and notifications
    const rules = familyState?.rules || [];
    const notifications = familyState?.notifications || [];
    const members = familyState?.members || [];

    const [newRuleTrigger, setNewRuleTrigger] = useState('');
    const [newRuleAdvice, setNewRuleAdvice] = useState('');
    const [newRuleCategory, setNewRuleCategory] = useState('Nutrition');
    const [newRuleSeverity, setNewRuleSeverity] = useState('Low');

    const handleAddRule = (e) => {
        e.preventDefault();
        if (!newRuleTrigger || !newRuleAdvice) return;
        const newRule = {
            id: Date.now(),
            trigger: newRuleTrigger,
            advice: newRuleAdvice,
            category: newRuleCategory,
            severity: newRuleSeverity
        };
        updateFamilyRules([...rules, newRule]);
        setNewRuleTrigger('');
        setNewRuleAdvice('');
        alert("✅ Family Rule added successfully!");
    };

    const handleDeleteRule = (id) => {
        if (window.confirm("Delete this rule from the family hub?")) {
            updateFamilyRules(rules.filter(r => r.id !== id));
        }
    };

    const handleRoleChange = (uid, newRole) => {
        updateMemberRole(uid, newRole);
    };

    const handleDeleteUser = (uid) => {
        if (window.confirm("⚠️ This will remove the member from your family hub. Are you sure?")) {
            removeMember(uid);
        }
    };

    if (familyState?.role?.toLowerCase() !== 'admin') {
        return (
            <div style={{ textAlign: 'center', marginTop: '100px', color: 'white' }}>
                <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
                <h2>Access Denied</h2>
                <p style={{ opacity: 0.6 }}>You must be the Family Admin to access this page.</p>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '60px' }}>
            {/* Header Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 6px 0', background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Family Hub Admin Control
                    </h1>
                    <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                        Manage members, moderate activity, and set family dietary/health rules.
                    </p>
                </div>
            </div>

            {/* Admin Tab Controller Navigation Bar */}
            <div style={{
                display: 'flex', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px',
                padding: '6px', gap: '6px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap'
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
                    Hub Status
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
                    Members
                </button>
                <button 
                    onClick={() => setActiveTab('rules')}
                    style={{
                        flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                        border: 'none', fontWeight: '600', fontSize: '13px',
                        background: activeTab === 'rules' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                        color: activeTab === 'rules' ? '#34d399' : 'rgba(255,255,255,0.6)'
                    }}
                >
                    Family Rules
                </button>
                <button 
                    onClick={() => {
                        setActiveTab('moderation');
                        markNotificationsRead();
                    }}
                    style={{
                        flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                        border: 'none', fontWeight: '600', fontSize: '13px',
                        background: activeTab === 'moderation' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                        color: activeTab === 'moderation' ? '#f87171' : 'rgba(255,255,255,0.6)'
                    }}
                >
                    Activity Log
                </button>
            </div>

            {/* Hub Status Tab */}
            {activeTab === 'telemetry' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(255,255,255,0.06)', padding: '24px', borderRadius: '20px', backdropFilter: 'blur(12px)', maxWidth: '500px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <HardDrive size={18} color="#c084fc" /> Family Hub Metrics
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Subscription Tier</span>
                                <strong style={{ color: '#38bdf8' }}>{familyState.subscription?.tier || 'Free'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Total Members</span>
                                <strong style={{ color: 'white' }}>{members.length} / {familyState.subscription?.tier === 'premium' ? '6' : '3'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Active Challenges</span>
                                <strong style={{ color: '#c084fc' }}>{familyState.challenges?.length || 0}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Hub Code</span>
                                <strong style={{ color: '#34d399', letterSpacing: '2px' }}>{familyState.familyCode}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Members Management Tab */}
            {activeTab === 'users' && (
                <div style={{
                    background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '24px', padding: '30px'
                }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: '0 0 16px 0' }}>
                        Family Members Control
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', color: 'white', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}>
                                    <th style={{ padding: '12px 8px' }}>Name / UID</th>
                                    <th style={{ padding: '12px 8px' }}>Role</th>
                                    <th style={{ padding: '12px 8px' }}>Sharing</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((user) => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={{ padding: '16px 8px' }}>
                                            <strong style={{ display: 'block' }}>{user.name} {user.isSelf ? "(You)" : ""}</strong>
                                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{user.id}</span>
                                        </td>
                                        <td style={{ padding: '16px 8px' }}>
                                            <select
                                                value={user.role || 'Member'}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                disabled={user.isSelf}
                                                style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '4px 8px', borderRadius: '6px' }}
                                            >
                                                <option value="Admin">Admin</option>
                                                <option value="Parent">Parent</option>
                                                <option value="Member">Member</option>
                                                <option value="Child">Child</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '16px 8px' }}>
                                            <span style={{ fontSize: '11px', color: user.permissions?.health ? '#34d399' : '#f87171', display: 'block' }}>Health: {user.permissions?.health ? 'ON' : 'OFF'}</span>
                                            <span style={{ fontSize: '11px', color: user.permissions?.finance ? '#38bdf8' : '#f87171', display: 'block' }}>Finance: {user.permissions?.finance ? 'ON' : 'OFF'}</span>
                                        </td>
                                        <td style={{ padding: '16px 8px' }}>
                                            {!user.isSelf && (
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button 
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        title="Remove Member"
                                                        style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', padding: '6px 12px', borderRadius: '6px', color: '#F87171', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Family Rules Tab */}
            {activeTab === 'rules' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '24px', padding: '30px'
                    }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Layers size={22} color="#34d399" /> Family Dietary & Health Rules
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '30px' }}>
                            {rules.length === 0 && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>No custom rules set.</p>}
                            {rules.map((rule) => (
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

                        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'white', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Plus size={18} color="#34d399" /> Add New Family Rule
                            </h4>
                            <form onSubmit={handleAddRule}>
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Trigger Condition (e.g. Sugar &gt; 50g)</label>
                                    <input 
                                        type="text" 
                                        value={newRuleTrigger}
                                        onChange={(e) => setNewRuleTrigger(e.target.value)}
                                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Advice / Action</label>
                                    <textarea 
                                        value={newRuleAdvice}
                                        onChange={(e) => setNewRuleAdvice(e.target.value)}
                                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: 'white', boxSizing: 'border-box', minHeight: '60px' }}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Category</label>
                                        <select value={newRuleCategory} onChange={(e) => setNewRuleCategory(e.target.value)} style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: 'white' }}>
                                            <option value="Nutrition">Nutrition</option>
                                            <option value="Activity">Activity</option>
                                            <option value="Finance">Finance</option>
                                            <option value="Screen Time">Screen Time</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Priority</label>
                                        <select value={newRuleSeverity} onChange={(e) => setNewRuleSeverity(e.target.value)} style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: 'white' }}>
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                                    Add Rule
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Log Tab */}
            {activeTab === 'moderation' && (
                <div style={{
                    background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '24px', padding: '30px'
                }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldAlert size={22} color="#f87171" /> Family Activity & Logs
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {notifications.length === 0 && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>No recent activity to show.</p>}
                        {notifications.map((notif, idx) => (
                            <div key={idx} style={{
                                background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '16px', alignItems: 'center'
                            }}>
                                <div style={{ 
                                    background: notif.type === 'member_joined' ? 'rgba(16,185,129,0.1)' : 'rgba(56,189,248,0.1)', 
                                    padding: '10px', borderRadius: '12px' 
                                }}>
                                    {notif.type === 'member_joined' ? <Users size={20} color="#34d399" /> : <AlertCircle size={20} color="#38bdf8" />}
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', color: 'white', marginBottom: '4px' }}>
                                        {notif.type === 'member_joined' 
                                            ? <strong>{notif.memberName} joined the family!</strong> 
                                            : <span>{notif.message}</span>}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                                        {new Date(notif.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
