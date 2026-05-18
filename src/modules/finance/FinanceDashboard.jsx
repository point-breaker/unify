import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, TrendingUp, DollarSign, Gift, Shield, AlertCircle, ArrowDownCircle, LayoutGrid, PieChart as PieIcon } from 'lucide-react';
import styles from './FinanceRefined.module.css';
import { useLocation } from '../../contexts/LocationContext';
import { useFinance } from '../../contexts/FinanceContext';
import { useFamily } from '../../contexts/FamilyContext';

const FinanceDashboard = () => {
    const { location } = useLocation();
    const { financeState, updateFinance } = useFinance();
    const currency = location.currency;

    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'allocator'
    const [viewMode, setViewMode] = useState('personal'); // 'personal' | 'household'
    const [incomeInput, setIncomeInput] = useState('');

    // Setup Form State
    const [setupNetWorth, setSetupNetWorth] = useState('');
    const [setupBudget, setSetupBudget] = useState('');
    const { updateFamilyMemberStats } = useFamily();

    const handleSetupFinance = async () => {
        if (!setupNetWorth || !setupBudget) return;

        const nw = parseInt(setupNetWorth);
        const bug = parseInt(setupBudget);

        const initialFinance = {
            netWorth: nw,
            budgetLimit: bug,
            monthlySpending: 0,
            envelopes: [
                { name: 'Needs', limit: bug * 0.5, current: bug * 0.5, color: '#3B82F6' },
                { name: 'Wants', limit: bug * 0.3, current: bug * 0.3, color: '#F59E0B' },
                { name: 'Savings', limit: bug * 0.2, current: bug * 0.2, color: '#10B981' }
            ]
        };

        await updateFinance(initialFinance);

        if (updateFamilyMemberStats) {
            await updateFamilyMemberStats('finance', {
                netWorth: nw,
                budget: bug,
                spending: 0
            });
        }
    };

    // Use Context State instead of local state
    const envelopes = financeState.envelopes;

    // --- Family / Admin Logic ---
    const { familyState, getHouseholdStats, getLeaderboard } = useFamily();
    const [selectedMemberId, setSelectedMemberId] = useState('admin');

    // Household Aggregation
    const householdStats = getHouseholdStats ? getHouseholdStats() : null;
    const leaderboard = getLeaderboard ? getLeaderboard('finance') : [];

    let displayFinance = financeState; // Default to my finance
    let isPrivate = false;

    // View Mode Logic (Personal vs Household)
    // If Household mode is active, override displayFinance with aggregated data
    if (viewMode === 'household' && householdStats) {
        displayFinance = {
            netWorth: householdStats.netWorth,
            // Virtual envelopes for summary
            envelopes: [
                { name: 'Total Spending', current: householdStats.spending, limit: 5000, color: '#EF4444' }
            ]
        };
    } else if (familyState?.role === 'admin' && selectedMemberId !== 'admin') {
        const member = familyState.members.find(m => m.id === selectedMemberId);
        if (member) {
            if (member.permissions?.finance === false) {
                isPrivate = true;
            } else if (member.finance) {
                // Mock finance data adapter
                displayFinance = {
                    netWorth: member.finance.netWorth,
                    envelopes: [
                        { name: 'Groceries', current: member.finance.budget * 0.4, limit: member.finance.budget * 0.4, color: '#10B981' },
                        { name: 'Spending', current: member.finance.spending, limit: member.finance.budget * 0.6, color: '#3B82F6' }
                    ]
                };
            }
        }
    }

    // Override 'envelopes' used in render if switching user
    const currentEnvelopes = displayFinance.envelopes || envelopes;

    // ... (allocator logic) ...

    return (
        <div className={styles.dashboard}>
            {/* ... header ... */}

            {activeTab === 'overview' ? (
                /* OVERVIEW TAB CONTENT */
                <div className={styles.fadeIn}>
                    {/* Toggle Buttons */}
                    <div className={styles.toggleContainer} style={{ marginBottom: 20, width: 'fit-content' }}>
                        <button
                            className={viewMode === 'personal' ? styles.activeToggle : styles.toggleBtn}
                            onClick={() => setViewMode('personal')}
                        >
                            <Wallet size={14} /> My Finances
                        </button>
                        <button
                            className={viewMode === 'household' ? styles.activeToggle : styles.toggleBtn}
                            onClick={() => setViewMode('household')}
                        >
                            <LayoutGrid size={14} /> Household
                        </button>
                    </div>

                    {/* SETUP MODE (If no data) */}
                    {displayFinance.netWorth === 0 && !isPrivate && viewMode === 'personal' ? (

                        <div className={styles.card} style={{ gridColumn: 'span 2', padding: 40, textAlign: 'center', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '1px dashed var(--success)' }}>
                            <div style={{ background: 'var(--success)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <DollarSign size={24} color="white" />
                            </div>
                            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Set Up Your Finances</h3>
                            <p style={{ maxWidth: 400, margin: '0 auto 24px', opacity: 0.8 }}>Start your journey to financial freedom by entering your current status.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 400, margin: '0 auto' }}>
                                <input
                                    className={styles.moneyInput}
                                    placeholder="Total Net Worth ($)"
                                    type="number"
                                    value={setupNetWorth}
                                    onChange={(e) => setSetupNetWorth(e.target.value)}
                                />
                                <input
                                    className={styles.moneyInput}
                                    placeholder="Monthly Budget ($)"
                                    type="number"
                                    value={setupBudget}
                                    onChange={(e) => setSetupBudget(e.target.value)}
                                />
                            </div>
                            <button
                                style={{ marginTop: 24, padding: '10px 24px', background: 'var(--success)', borderRadius: 8, border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                                onClick={handleSetupFinance}
                            >
                                Initialize Account
                            </button>
                        </div>
                    ) : (
                        /* Normal Dashboard Content */
                        <>
                            {/* ... Overview Grid Content (existing) ... */}
                            <div className={styles.overviewGrid}>

                                {/* ADMIN SELECTOR UI (Only show in Personal Mode) */}
                                {viewMode === 'personal' && familyState && familyState.role === 'admin' && (
                                    <div style={{ gridColumn: 'span 2', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>View Member:</span>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4, display: 'flex', gap: 4 }}>
                                            <button onClick={() => setSelectedMemberId('admin')} style={{ background: selectedMemberId === 'admin' ? 'var(--accent)' : 'transparent', color: selectedMemberId === 'admin' ? 'white' : 'var(--text-secondary)', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Me</button>
                                            {familyState.members.map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setSelectedMemberId(m.id)}
                                                    style={{
                                                        background: selectedMemberId === m.id ? 'var(--accent)' : 'transparent',
                                                        color: selectedMemberId === m.id ? 'white' : 'var(--text-secondary)',
                                                        border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer'
                                                    }}
                                                >
                                                    {m.name.split(' ')[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isPrivate ? (
                                    <div style={{
                                        gridColumn: 'span 2',
                                        padding: 60,
                                        textAlign: 'center',
                                        background: 'rgba(0,0,0,0.3)',
                                        borderRadius: 16,
                                        border: '1px solid var(--glass-border)',
                                        backdropFilter: 'blur(10px)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        animation: 'fadeIn 0.5s ease-out'
                                    }}>
                                        <Shield size={48} color="var(--text-secondary)" style={{ marginBottom: 16, opacity: 0.5 }} />
                                        <h3 style={{ fontSize: 18, marginBottom: 8 }}>Financial Data Private</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{familyState.members.find(m => m.id === selectedMemberId)?.name} has chosen not to share this data.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className={styles.balanceCard}>
                                            <div className={styles.label}>{viewMode === 'household' ? 'Total Household Net Worth' : 'Net Worth'}</div>
                                            <div className={styles.amount}>{currency}{displayFinance.netWorth?.toLocaleString()}</div>
                                            <div className={styles.change}>
                                                <TrendingUp size={16} />
                                                <span>+2.4% this month</span>
                                            </div>
                                        </div>
                                        <div className={styles.spendingCard}>
                                            <div className={styles.label}>{viewMode === 'household' ? 'Total Household Spending' : 'Monthly Spending'}</div>
                                            <div className={styles.amount}>{currency}{displayFinance.envelopes ? Math.round(displayFinance.envelopes.reduce((acc, e) => acc + (e.limit - e.current), 0)) : 0}</div>
                                            <div className={styles.budgetStatus}>
                                                <span style={{ color: 'var(--success)' }}>On Track</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* SAVINGS LEADERBOARD (Only in Household View) */}
                                {viewMode === 'household' && leaderboard.length > 0 && (
                                    <div style={{ gridColumn: 'span 2', background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid var(--glass-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                            <div style={{ padding: 6, background: '#10B981', borderRadius: 8 }}><TrendingUp size={18} color="white" /></div>
                                            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Savings Leaderboard</h3>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                            {leaderboard.map((m, idx) => (
                                                <div key={m.id} style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <span style={{ fontWeight: 700, color: idx === 0 ? '#10B981' : '#666' }}>#{idx + 1}</span>
                                                        <span>{m.name}</span>
                                                    </div>
                                                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>{currency}{m.score.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Envelopes Section */}
                            {!isPrivate && (
                                <section className={styles.section}>
                                    <h3 className={styles.sectionTitle}>Budget Envelopes</h3>
                                    <div className={styles.envelopeGrid}>
                                        {currentEnvelopes.map((env) => (
                                            <EnvelopeCard key={env.name} env={env} currency={currency} />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>
            ) : (
                /* ALLOCATOR TAB CONTENT */
                <div className={styles.fadeIn}>
                    <section className={styles.allocatorCard}>
                        <div className={styles.allocatorHeader}>
                            <div className={styles.iconBox} style={{ background: 'var(--grad-finance)' }}>
                                <DollarSign size={20} color="white" />
                            </div>
                            <div>
                                <h3>Smart Income Allocator</h3>
                                <p className={styles.subtitle}>Enter your paycheck to preview the 50/30/20 split.</p>
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <input
                                type="number"
                                placeholder={`Enter amount (e.g. ${currency}5000)`}
                                value={incomeInput}
                                onChange={(e) => handleSimulateAllocation(e.target.value)}
                                className={styles.moneyInput}
                            />
                        </div>

                        {/* Visualization Module */}
                        {allocationPreview.length > 0 && (
                            <div className={styles.splitPreview}>
                                <div style={{ width: 200, height: 200 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={allocationPreview} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {allocationPreview.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `${currency}${value}`} contentStyle={{ background: '#1E232D', border: 'none' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className={styles.splitLegend}>
                                    {allocationPreview.map((item) => (
                                        <div key={item.name} className={styles.legendItem}>
                                            <span className={styles.dot} style={{ background: item.color }}></span>
                                            <span className={styles.legendLabel}>{item.name}</span>
                                            <span className={styles.legendValue}>{currency}{Math.round(item.value)}</span>
                                        </div>
                                    ))}
                                    <button onClick={handleApplyAllocation} className={styles.allocateBtn} style={{ marginTop: 16, width: '100%' }}>
                                        <ArrowDownCircle size={18} />
                                        Apply Distribution
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            )
            }
        </div >
    );
};

const EnvelopeCard = ({ env, currency }) => {
    const { spendFromEnvelope } = useFinance();
    const [isSpending, setIsSpending] = useState(false);
    const [spendAmount, setSpendAmount] = useState('');

    const percentage = (env.current / env.limit) * 100;
    const isLow = percentage < 20; // Warn if < 20% remaining

    const handleSpend = () => {
        if (!spendAmount) return;
        spendFromEnvelope(env.name, spendAmount);
        setIsSpending(false);
        setSpendAmount('');
    };

    return (
        <div className={styles.envelopeCard}>
            <div className={styles.envHeader}>
                <span style={{ fontWeight: 500 }}>{env.name}</span>
                <span className={styles.envAmount} style={{ opacity: isSpending ? 0.3 : 1 }}>
                    {currency}{Math.round(env.current)} left
                </span>
            </div>

            {/* Progress Bar (Remaining) */}
            <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{
                        width: `${Math.min(percentage, 100)}%`,
                        background: isLow ? 'var(--danger)' : env.color,
                        transition: 'width 0.5s ease, background 0.3s'
                    }}
                />
            </div>

            {/* Interaction Area */}
            <div style={{ marginTop: 12, minHeight: 30, display: 'flex', justifyContent: 'flex-end' }}>
                {isSpending ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                            autoFocus
                            type="number"
                            placeholder="Amount"
                            className={styles.moneyInput}
                            style={{ width: 70, height: 28, fontSize: 13, padding: '0 8px' }}
                            value={spendAmount}
                            onChange={(e) => setSpendAmount(e.target.value)}
                        />
                        <button
                            onClick={handleSpend}
                            style={{ background: 'var(--success)', border: 'none', borderRadius: 4, padding: 4, cursor: 'pointer', display: 'flex' }}
                        >
                            <ArrowDownCircle size={16} color="white" />
                        </button>
                        <button
                            onClick={() => setIsSpending(false)}
                            style={{ background: 'transparent', border: '1px solid #444', borderRadius: 4, padding: 4, cursor: 'pointer', color: '#888', display: 'flex' }}
                        >
                            <span style={{ fontSize: 14, lineHeight: 1 }}>×</span>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsSpending(true)}
                        className={styles.spendBtn} // You might need to add this class or use inline
                        style={{
                            background: 'transparent',
                            border: '1px dashed #444',
                            color: 'var(--text-secondary)',
                            fontSize: 11,
                            borderRadius: 6,
                            padding: '4px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}
                    >
                        <DollarSign size={12} /> Log Expense
                    </button>
                )}
            </div>
        </div>
    );
};

export default FinanceDashboard;
