import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
    Wallet, TrendingUp, DollarSign, Shield, AlertCircle, ArrowDownCircle, 
    ArrowUpCircle, LayoutGrid, PieChart as PieIcon, Plus, Trash2, RotateCcw, 
    Brain, Sparkles, Filter, Search, Calendar, ChevronDown, ChevronUp, Settings, 
    Check, AlertTriangle, X, UploadCloud, Eye, Download, CalendarDays, Lock, Unlock, FileSpreadsheet 
} from 'lucide-react';
import styles from './FinanceRefined.module.css';
import { useLocation } from '../../contexts/LocationContext';
import { useFinance } from '../../contexts/FinanceContext';
import { useFamily } from '../../contexts/FamilyContext';

const FinanceDashboard = () => {
    const { location } = useLocation();
    const { 
        financeState, 
        updateFinance, 
        spendFromEnvelope, 
        logIncome, 
        addCustomEnvelope, 
        deleteCustomEnvelope, 
        adjustEnvelopeLimit, 
        deleteTransaction,
        addSubscription,
        deleteSubscription,
        paySubscription,
        toggleEnvelopeGoal
    } = useFinance();
    
    const currency = location.currency;
    const today = new Date();

    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'allocator'
    const [viewMode, setViewMode] = useState('personal'); // 'personal' | 'household'
    const [incomeInput, setIncomeInput] = useState('');

    // Setup Form State
    const [setupNetWorth, setSetupNetWorth] = useState('');
    const [setupBudget, setSetupBudget] = useState('');
    const { updateFamilyMemberStats } = useFamily();

    // Toggle forms
    const [showIncomeForm, setShowIncomeForm] = useState(false);
    const [incomeAmount, setIncomeAmount] = useState('');
    const [incomeDesc, setIncomeDesc] = useState('');
    
    // Envelope Manager Toggles
    const [showEnvManager, setShowEnvManager] = useState(false);
    const [newEnvName, setNewEnvName] = useState('');
    const [newEnvLimit, setNewEnvLimit] = useState('');
    const [newEnvColor, setNewEnvColor] = useState('#3B82F6');

    // Filter/Search Transaction State
    const [txSearch, setTxSearch] = useState('');
    const [txFilter, setTxFilter] = useState('all'); // 'all' | 'income' | 'expense' | 'system'

    // AI Scanner state simulation
    const [isScanning, setIsScanning] = useState(false);
    const [scanningReceiptName, setScanningReceiptName] = useState('');
    
    // Manual log transaction modal triggered by scan
    const [scanLogModal, setScanLogModal] = useState(null);

    // Subscription form state
    const [showSubForm, setShowSubForm] = useState(false);
    const [subName, setSubName] = useState('');
    const [subAmount, setSubAmount] = useState('');
    const [subDueDate, setSubDueDate] = useState('');
    const [subEnvelope, setSubEnvelope] = useState('Needs');

    // Household Control Console state
    const [adminSpendCeiling, setAdminSpendCeiling] = useState('1500');
    const [customEnvelopeLock, setCustomEnvelopeLock] = useState(false);
    const [velAlertThreshold, setVelAlertThreshold] = useState('80');
    const [showAdminConsole, setShowAdminConsole] = useState(false);

    const colorPalette = [
        { name: 'Blue', hex: '#3B82F6' },
        { name: 'Orange', hex: '#F59E0B' },
        { name: 'Emerald', hex: '#10B981' },
        { name: 'Purple', hex: '#8B5CF6' },
        { name: 'Pink', hex: '#EC4899' },
        { name: 'Sky', hex: '#06B6D4' },
        { name: 'Rose', hex: '#F43F5E' },
        { name: 'Amber', hex: '#D97706' }
    ];

    const sampleReceipts = [
        { label: 'Starbucks Coffee', amount: 6.80, envelope: 'Wants', desc: 'Caramel Macchiato & Cookie' },
        { label: 'Whole Foods Market', amount: 42.50, envelope: 'Needs', desc: 'Weekly fresh vegetables & dairy' },
        { label: 'Apple Online Store', amount: 129.00, envelope: 'Wants', desc: 'Apple Pencil replacement tip & cover' }
    ];

    const handleSetupFinance = async () => {
        if (!setupNetWorth || !setupBudget) return;

        const nw = parseInt(setupNetWorth);
        const bug = parseInt(setupBudget);

        const initialFinance = {
            netWorth: nw,
            budgetLimit: bug,
            monthlySpending: 0,
            isBudgetOnTrack: true,
            envelopes: [
                { name: 'Needs', limit: bug * 0.5, current: bug * 0.5, color: '#3B82F6', isGoal: false, targetAmount: 0, targetDate: '' },
                { name: 'Wants', limit: bug * 0.3, current: bug * 0.3, color: '#F59E0B', isGoal: false, targetAmount: 0, targetDate: '' },
                { name: 'Savings', limit: bug * 0.2, current: bug * 0.2, color: '#10B981', isGoal: false, targetAmount: 0, targetDate: '' }
            ],
            transactions: [
                {
                    id: `tx_setup_${Date.now()}`,
                    date: new Date().toISOString(),
                    amount: nw,
                    type: 'system',
                    category: 'Net Worth',
                    description: 'Account initialized'
                }
            ],
            subscriptions: []
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

    // Use Context State
    const envelopes = financeState.envelopes || [];
    const transactions = financeState.transactions || [];
    const subscriptions = financeState.subscriptions || [];

    // --- Family / Admin Logic ---
    const { familyState, getHouseholdStats, getLeaderboard } = useFamily();
    const [selectedMemberId, setSelectedMemberId] = useState('admin');

    // Household Aggregation
    const householdStats = getHouseholdStats ? getHouseholdStats() : null;
    const leaderboard = getLeaderboard ? getLeaderboard('finance') : [];

    let displayFinance = financeState; // Default to my finance
    let isPrivate = false;

    // View Mode Logic (Personal vs Household)
    if (viewMode === 'household' && householdStats) {
        displayFinance = {
            netWorth: householdStats.netWorth,
            monthlySpending: householdStats.spending,
            budgetLimit: 5000,
            isBudgetOnTrack: householdStats.spending < 5000,
            envelopes: [
                { name: 'Household Budget', current: Math.max(0, 5000 - householdStats.spending), limit: 5000, color: '#EF4444' }
            ],
            transactions: [],
            subscriptions: []
        };
    } else if (familyState?.role === 'admin' && selectedMemberId !== 'admin') {
        const member = familyState.members.find(m => m.id === selectedMemberId);
        if (member) {
            if (member.permissions?.finance === false) {
                isPrivate = true;
            } else if (member.finance) {
                displayFinance = {
                    netWorth: member.finance.netWorth,
                    monthlySpending: member.finance.spending,
                    budgetLimit: member.finance.budget,
                    isBudgetOnTrack: member.finance.spending < member.finance.budget,
                    envelopes: [
                        { name: 'Groceries', current: member.finance.budget * 0.4, limit: member.finance.budget * 0.4, color: '#10B981' },
                        { name: 'Discretionary', current: member.finance.budget * 0.6 - member.finance.spending, limit: member.finance.budget * 0.6, color: '#3B82F6' }
                    ],
                    transactions: [],
                    subscriptions: []
                };
            }
        }
    }

    const currentEnvelopes = displayFinance.envelopes || envelopes;
    const currentTransactions = viewMode === 'personal' && selectedMemberId === 'admin' ? transactions : [];

    // Smart Income Allocator State and Actions
    const [allocationPreview, setAllocationPreview] = useState([]);

    const handleSimulateAllocation = (val) => {
        setIncomeInput(val);
        const amount = parseFloat(val);
        if (isNaN(amount) || amount <= 0) {
            setAllocationPreview([]);
            return;
        }
        setAllocationPreview([
            { name: 'Needs (50%)', value: amount * 0.5, color: '#3B82F6' },
            { name: 'Wants (30%)', value: amount * 0.3, color: '#F59E0B' },
            { name: 'Savings (20%)', value: amount * 0.2, color: '#10B981' }
        ]);
    };

    const handleApplyAllocation = async () => {
        if (allocationPreview.length === 0) return;
        const needsLimit = allocationPreview[0].value;
        const wantsLimit = allocationPreview[1].value;
        const savingsLimit = allocationPreview[2].value;

        const updatedEnvelopes = [
            { name: 'Needs', limit: needsLimit, current: needsLimit, color: '#3B82F6', isGoal: false, targetAmount: 0, targetDate: '' },
            { name: 'Wants', limit: wantsLimit, current: wantsLimit, color: '#F59E0B', isGoal: false, targetAmount: 0, targetDate: '' },
            { name: 'Savings', limit: savingsLimit, current: savingsLimit, color: '#10B981', isGoal: false, targetAmount: 0, targetDate: '' }
        ];

        const budgetLimit = needsLimit + wantsLimit + savingsLimit;

        const allocationTx = {
            id: `tx_alloc_${Date.now()}`,
            date: new Date().toISOString(),
            amount: budgetLimit,
            type: 'system',
            category: 'Allocation',
            description: `Smart 50/30/20 allocation applied: ${currency}${budgetLimit.toFixed(0)}`
        };

        await updateFinance({
            budgetLimit,
            envelopes: updatedEnvelopes,
            monthlySpending: 0,
            isBudgetOnTrack: true,
            transactions: [allocationTx, ...transactions]
        });

        if (updateFamilyMemberStats) {
            await updateFamilyMemberStats('finance', {
                netWorth: displayFinance.netWorth,
                budget: budgetLimit,
                spending: 0
            });
        }

        alert("Income Allocation Applied Successfully!\nYour budget envelopes have been replenished.");
        setIncomeInput('');
        setAllocationPreview([]);
        setActiveTab('overview');
    };

    // General Income logging action
    const handleLogIncomeSubmit = async (e) => {
        e.preventDefault();
        const amt = parseFloat(incomeAmount);
        if (isNaN(amt) || amt <= 0) return;

        await logIncome(amt, incomeDesc);
        
        if (updateFamilyMemberStats) {
            await updateFamilyMemberStats('finance', {
                netWorth: displayFinance.netWorth + amt,
                budget: displayFinance.budgetLimit,
                spending: displayFinance.monthlySpending
            });
        }

        setIncomeAmount('');
        setIncomeDesc('');
        setShowIncomeForm(false);
    };

    // Custom Envelope Creator action
    const handleCreateEnvelopeSubmit = async (e) => {
        e.preventDefault();
        const limit = parseFloat(newEnvLimit);
        if (!newEnvName.trim() || isNaN(limit) || limit <= 0) return;

        if (customEnvelopeLock && familyState?.role !== 'admin') {
            alert("Administrative Controls Lock: You do not have permission to add new envelopes.");
            return;
        }

        await addCustomEnvelope(newEnvName.trim(), limit, newEnvColor);

        setNewEnvName('');
        setNewEnvLimit('');
        setShowEnvManager(false);
    };

    // Simulated AI Receipt Scanning Execution
    const handleScanReceipt = (receipt) => {
        if (customEnvelopeLock && familyState?.role !== 'admin') {
            alert("Administrative Controls Lock: Spend logs are locked.");
            return;
        }
        setIsScanning(true);
        setScanningReceiptName(receipt.label);

        setTimeout(() => {
            setIsScanning(false);
            setScanLogModal(receipt);
        }, 2200);
    };

    const confirmScanTransaction = async () => {
        if (!scanLogModal) return;
        await spendFromEnvelope(scanLogModal.envelope, scanLogModal.amount, `AI Scan: ${scanLogModal.label} - ${scanLogModal.desc}`);
        setScanLogModal(null);
    };

    // Add Subscription Submit
    const handleAddSubscription = async (e) => {
        e.preventDefault();
        const amt = parseFloat(subAmount);
        if (!subName.trim() || isNaN(amt) || amt <= 0 || !subDueDate) return;

        await addSubscription(subName, amt, subDueDate, subEnvelope);
        setSubName('');
        setSubAmount('');
        setSubDueDate('');
        setShowSubForm(false);
    };

    // CSV Transaction Export
    const handleExportLedgerCSV = () => {
        if (transactions.length === 0) {
            alert("No transaction ledger items found to export.");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID,Date,Amount,Type,Envelope/Category,Description\n";

        transactions.forEach(tx => {
            const formattedDate = new Date(tx.date).toLocaleString().replace(/,/g, '');
            const row = [
                tx.id,
                `"${formattedDate}"`,
                tx.amount,
                tx.type,
                `"${tx.category}"`,
                `"${tx.description.replace(/"/g, '""')}"`
            ].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `unify_finance_ledger_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Dynamic AI Coach Insight formulation
    const aiTips = useMemo(() => {
        if (isPrivate || currentEnvelopes.length === 0) return [];
        const day = today.getDate();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const monthProgress = day / daysInMonth;

        const tips = [];
        const totalSpent = currentEnvelopes.reduce((acc, e) => acc + (e.limit - e.current), 0);
        const spentRatio = displayFinance.budgetLimit > 0 ? totalSpent / displayFinance.budgetLimit : 0;

        // Overall pacing check
        if (spentRatio > monthProgress + 0.12) {
            tips.push({
                type: 'warning',
                text: `Velocity Warning: You have spent ${Math.round(spentRatio * 100)}% of your global budget, but the month is only ${Math.round(monthProgress * 100)}% complete. Consider deferring non-essential wants.`
            });
        } else if (spentRatio < monthProgress - 0.1) {
            tips.push({
                type: 'success',
                text: `Excellent Pacing: You've utilized just ${Math.round(spentRatio * 100)}% of your monthly budget. Operating below your spending speed leaves more room for wealth compounding!`
            });
        }

        // Specific envelopes high-depletion warnings
        currentEnvelopes.forEach(env => {
            if (env.isGoal) {
                // savings goal milestone tracking
                const savedPercentage = (env.current / env.targetAmount) * 100;
                if (savedPercentage < 30 && monthProgress > 0.5) {
                    tips.push({
                        type: 'warning',
                        text: `Milestone Risk: Your "${env.name}" savings milestone is at ${Math.round(savedPercentage)}% of target. Accumulate at least ${currency}${Math.round(env.targetAmount / 4)} more to avoid deadline delay.`
                    });
                }
            } else {
                const envSpent = env.limit - env.current;
                const envRatio = env.limit > 0 ? envSpent / env.limit : 0;
                if (envRatio > monthProgress + 0.20 && env.current > 0) {
                    tips.push({
                        type: 'alert',
                        text: `The "${env.name}" envelope is draining rapidly (${Math.round(envRatio * 100)}% spent). Try cooling off on this category for a few days.`
                    });
                }
            }
        });

        // Subscriptions forecast tips
        const totalSubAmt = subscriptions.reduce((acc, s) => acc + s.amount, 0);
        if (totalSubAmt > 0) {
            tips.push({
                type: 'info',
                text: `Fixed Commitments: You have ${subscriptions.length} registered subscription bills totaling ${currency}${Math.round(totalSubAmt)}/mo. This accounts for ${Math.round((totalSubAmt / (displayFinance.budgetLimit || 1)) * 100)}% of your monthly budget capacity.`
            });
        }

        return tips;
    }, [currentEnvelopes, displayFinance.budgetLimit, displayFinance.netWorth, currency, isPrivate, subscriptions]);

    // Donut visualization data preparation
    const spendingChartData = useMemo(() => {
        return currentEnvelopes.map(env => ({
            name: env.name,
            value: Math.max(0, env.limit - env.current),
            color: env.color
        })).filter(d => d.value > 0);
    }, [currentEnvelopes]);

    const totalActualSpending = currentEnvelopes.reduce((acc, e) => acc + (e.limit - e.current), 0);

    // Filtered Ledger transactions
    const filteredTransactions = useMemo(() => {
        return currentTransactions.filter(tx => {
            const matchSearch = tx.description.toLowerCase().includes(txSearch.toLowerCase()) || 
                                 tx.category.toLowerCase().includes(txSearch.toLowerCase());
            
            if (!matchSearch) return false;
            if (txFilter === 'all') return true;
            return tx.type === txFilter;
        });
    }, [currentTransactions, txSearch, txFilter]);

    return (
        <div className={styles.dashboard}>
            {/* Header tab controls */}
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>Finance Center</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Track cash envelopes, savings milestones, log receipts, and recurring subscriptions.</p>
                </div>
                
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className={styles.tabGroup}>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <LayoutGrid size={16} /> Overview
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'allocator' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('allocator')}
                        >
                            <PieIcon size={16} /> Income Allocator
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'overview' ? (
                <div className={styles.fadeIn}>
                    {/* Toolbar controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                        <div className={styles.toggleContainer} style={{ width: 'fit-content' }}>
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

                        {viewMode === 'personal' && selectedMemberId === 'admin' && displayFinance.netWorth > 0 && (
                            <div className={styles.actionBtnGroup}>
                                <button 
                                    onClick={() => setShowIncomeForm(!showIncomeForm)} 
                                    className={styles.actionBtn}
                                    style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                                >
                                    <ArrowUpCircle size={16} /> Log Income
                                </button>
                                <button 
                                    onClick={() => setShowEnvManager(!showEnvManager)} 
                                    className={styles.actionBtn}
                                >
                                    <Settings size={16} /> Envelope targets
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Income entry form */}
                    {showIncomeForm && (
                        <div className={styles.card} style={{ marginBottom: 24, padding: 20, background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', margin: 0 }}><ArrowUpCircle size={18} /> Record New Earnings</h4>
                                <button onClick={() => setShowIncomeForm(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}><X size={18} /></button>
                            </div>
                            <form onSubmit={handleLogIncomeSubmit} className={styles.incomeForm}>
                                <input 
                                    type="number" 
                                    placeholder={`Amount (${currency})`} 
                                    required 
                                    value={incomeAmount} 
                                    onChange={(e) => setIncomeAmount(e.target.value)}
                                    className={styles.moneyInput}
                                    style={{ padding: '10px 14px', fontSize: 15 }}
                                />
                                <input 
                                    type="text" 
                                    placeholder="Source description (e.g. Salary, Side project, Dividend)" 
                                    value={incomeDesc} 
                                    onChange={(e) => setIncomeDesc(e.target.value)}
                                    className={styles.moneyInput}
                                    style={{ padding: '10px 14px', fontSize: 15 }}
                                />
                                <button type="submit" className={styles.allocateBtn} style={{ margin: 0, padding: '10px 20px', background: 'var(--success)' }}>
                                    Record
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Envelope manager dropdown module */}
                    {showEnvManager && (
                        <div className={styles.card} style={{ marginBottom: 24, padding: 20, border: '1px dashed var(--glass-border)', background: 'rgba(0, 0, 0, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--info)', margin: 0 }}><Settings size={18} /> Custom Envelope Manager</h4>
                                <button onClick={() => setShowEnvManager(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}><X size={18} /></button>
                            </div>
                            
                            <form onSubmit={handleCreateEnvelopeSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', marginBottom: 20 }}>
                                <div style={{ flex: 1, minWidth: 150 }}>
                                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Envelope Title</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Subscriptions" 
                                        required 
                                        value={newEnvName} 
                                        onChange={(e) => setNewEnvName(e.target.value)}
                                        className={styles.moneyInput}
                                        style={{ padding: '8px 12px', fontSize: 14 }}
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: 120 }}>
                                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Budget Target ({currency})</label>
                                    <input 
                                        type="number" 
                                        placeholder="Limit" 
                                        required 
                                        value={newEnvLimit} 
                                        onChange={(e) => setNewEnvLimit(e.target.value)}
                                        className={styles.moneyInput}
                                        style={{ padding: '8px 12px', fontSize: 14 }}
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Visual Theme</label>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {colorPalette.map(c => (
                                            <button
                                                key={c.hex}
                                                type="button"
                                                onClick={() => setNewEnvColor(c.hex)}
                                                style={{
                                                    width: 24, height: 24, borderRadius: '50%', background: c.hex, border: newEnvColor === c.hex ? '2px solid white' : 'none',
                                                    transform: newEnvColor === c.hex ? 'scale(1.15)' : 'none', cursor: 'pointer', transition: 'all 0.15s'
                                                }}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className={styles.allocateBtn} style={{ margin: 0, padding: '9px 18px', background: 'var(--info)' }}>
                                    <Plus size={16} /> Create Envelope
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Log modal from Simulated Scan */}
                    {scanLogModal && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', zIndex: 1000
                        }}>
                            <div className={styles.card} style={{ width: '90%', maxWidth: 400, padding: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#C084FC', margin: 0 }}>
                                        <Sparkles size={18} /> AI Scanner Extracted Data
                                    </h4>
                                    <button onClick={() => setScanLogModal(null)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                                        <X size={18} />
                                    </button>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 8, marginBottom: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8, marginBottom: 8 }}>
                                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Merchant</span>
                                        <span style={{ fontSize: 13, fontWeight: 600 }}>{scanLogModal.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8, marginBottom: 8 }}>
                                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Extracted Total</span>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#EF4444' }}>{currency}{scanLogModal.amount.toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8, marginBottom: 8 }}>
                                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Recommended Envelope</span>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--info)' }}>{scanLogModal.envelope}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Details</span>
                                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{scanLogModal.desc}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button 
                                        onClick={confirmScanTransaction}
                                        style={{ flex: 1, padding: '10px', background: 'var(--success)', border: 'none', borderRadius: 8, color: 'black', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Log Expense
                                    </button>
                                    <button 
                                        onClick={() => setScanLogModal(null)}
                                        style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SETUP MODE (If no data) */}
                    {displayFinance.netWorth === 0 && !isPrivate && viewMode === 'personal' ? (
                        <div className={`${styles.card} ${styles.setupCard}`}>
                            <div style={{ background: 'var(--success)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <DollarSign size={24} color="white" />
                            </div>
                            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Set Up Your Finances</h3>
                            <p style={{ maxWidth: 400, margin: '0 auto 24px', opacity: 0.8 }}>Start your journey to financial freedom by entering your current status.</p>

                            <div className={styles.formGrid2Col} style={{ maxWidth: 400, margin: '0 auto' }}>
                                <input
                                    className={styles.moneyInput}
                                    placeholder={`Total Net Worth (${currency})`}
                                    type="number"
                                    value={setupNetWorth}
                                    onChange={(e) => setSetupNetWorth(e.target.value)}
                                />
                                <input
                                    className={styles.moneyInput}
                                    placeholder={`Monthly Budget (${currency})`}
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
                            {/* Summary cards and leaderboard */}
                            <div className={styles.overviewGrid}>
                                {viewMode === 'personal' && familyState && familyState.role === 'admin' && (
                                    <div className={styles.memberSelectWrapper}>
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
                                    <div className={styles.privateCard}>
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
                                            <div className={styles.amount}>{currency}{Math.round(totalActualSpending).toLocaleString()}</div>
                                            <div className={styles.budgetStatus}>
                                                <span style={{ color: displayFinance.isBudgetOnTrack ? 'var(--success)' : '#EF4444', fontWeight: 600 }}>
                                                    {displayFinance.isBudgetOnTrack ? 'On Track' : 'Over Budget'}
                                                </span>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: 12, marginLeft: 6 }}>
                                                    of {currency}{Math.round(displayFinance.budgetLimit).toLocaleString()} limit
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* SAVINGS LEADERBOARD (Only in Household View) */}
                                {viewMode === 'household' && leaderboard.length > 0 && (
                                    <div className={styles.leaderboardCard}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                            <div style={{ padding: 6, background: '#10B981', borderRadius: 8 }}><TrendingUp size={18} color="white" /></div>
                                            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Savings Leaderboard</h3>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                            {leaderboard.map((m, idx) => (
                                                <div key={m.id} style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', justifycontent: 'space-between' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <span style={{ fontWeight: 700, color: idx === 0 ? '#10B981' : '#666' }}>#{idx + 1}</span>
                                                        <span>{m.name}</span>
                                                    </div>
                                                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>{currency}{(m.score || 0).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Split Visual Layout */}
                            {!isPrivate && (
                                <div className={styles.splitLayout}>
                                    
                                    {/* Left Column: Charts, AI scanner, bills, and AI advisor */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        
                                        {/* AI RECEIPT SCANNER CARD SIMULATION */}
                                        {viewMode === 'personal' && selectedMemberId === 'admin' && (
                                            <div className={styles.card} style={{ padding: 20, position: 'relative' }}>
                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, margin: '0 0 8px 0', color: '#C084FC' }}>
                                                    <Brain size={18} /> Receipt AI OCR Scanner
                                                </h4>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, margin: '0 0 16px 0' }}>Simulate a camera OCR scanning invoice. Select a sample receipt to run real-time laser scans.</p>

                                                <div style={{ position: 'relative', border: '1px dashed rgba(192, 132, 252, 0.3)', background: 'rgba(0,0,0,0.2)', padding: '24px 16px', borderRadius: 8, textAlign: 'center', marginBottom: 16, overflow: 'hidden' }}>
                                                    {isScanning ? (
                                                        <div style={{ padding: '8px 0' }}>
                                                            <div className={styles.scanLine} />
                                                            <UploadCloud size={30} className={styles.pulse} style={{ color: '#C084FC', marginBottom: 8 }} />
                                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Analyzing invoice for "{scanningReceiptName}"...</div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Extracting merchant, total price & category</div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <UploadCloud size={24} style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 8 }} />
                                                            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Laser Scanner Offline. Select a sample below to simulate:</div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    {sampleReceipts.map(rec => (
                                                        <button
                                                            key={rec.label}
                                                            disabled={isScanning}
                                                            onClick={() => handleScanReceipt(rec)}
                                                            style={{
                                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                                padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                                                                borderRadius: 6, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => { if (!isScanning) e.currentTarget.style.background = 'rgba(192, 132, 252, 0.08)'; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                                        >
                                                            <div>
                                                                <span style={{ fontSize: 12, fontWeight: 600, color: 'white', display: 'block' }}>{rec.label}</span>
                                                                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{rec.desc}</span>
                                                            </div>
                                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>+{currency}{rec.amount.toFixed(2)}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* DYNAMIC CATEGORY SPENDING DONUT */}
                                        <div className={styles.card} style={{ padding: 20 }}>
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, margin: '0 0 16px 0' }}>
                                                <PieIcon size={16} color="var(--info)" /> Spending Allocation Breakdown
                                            </h4>
                                            
                                            {spendingChartData.length === 0 ? (
                                                <div style={{ height: 200, display: 'flex', flexDirection: 'column', justifycontent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
                                                    <DollarSign size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                                                    <span style={{ fontSize: 13 }}>No expenditures logged this month.</span>
                                                </div>
                                            ) : (
                                                <div className={styles.donutPreview}>
                                                    <div className={styles.donutChartContainer}>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie 
                                                                    data={spendingChartData} 
                                                                    innerRadius={55} 
                                                                    outerRadius={75} 
                                                                    paddingAngle={4} 
                                                                    dataKey="value"
                                                                >
                                                                    {spendingChartData.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip formatter={(value) => `${currency}${value}`} contentStyle={{ background: '#1E232D', border: 'none' }} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    
                                                    <div className={styles.donutLegendContainer}>
                                                        {spendingChartData.map(item => (
                                                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }}></span>
                                                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.name}</span>
                                                                </div>
                                                                <span style={{ fontSize: 12, fontWeight: 600 }}>{currency}{Math.round(item.value)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* SMART BILLS & SUBSCRIPTIONS TIMELINE */}
                                        {viewMode === 'personal' && selectedMemberId === 'admin' && (
                                            <div className={styles.card} style={{ padding: 20 }}>
                                                <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, margin: 0 }}>
                                                        <CalendarDays size={18} color="var(--accent)" /> Subscriptions & Bills
                                                    </h4>
                                                    <button 
                                                        onClick={() => setShowSubForm(!showSubForm)}
                                                        style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                    >
                                                        {showSubForm ? <X size={12} /> : <Plus size={12} />} Add Bill
                                                    </button>
                                                </div>

                                                {showSubForm && (
                                                    <form onSubmit={handleAddSubscription} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                                                        <div className={styles.formGrid2Col}>
                                                            <input 
                                                                type="text" placeholder="Bill Name (e.g. Netflix)" required 
                                                                value={subName} onChange={(e) => setSubName(e.target.value)}
                                                                className={styles.moneyInput} style={{ fontSize: 12.5, padding: 8, height: 'auto' }}
                                                            />
                                                            <input 
                                                                type="number" placeholder={`Amount (${currency})`} required 
                                                                value={subAmount} onChange={(e) => setSubAmount(e.target.value)}
                                                                className={styles.moneyInput} style={{ fontSize: 12.5, padding: 8, height: 'auto' }}
                                                            />
                                                        </div>
                                                        <div className={styles.formGrid2Col}>
                                                            <input 
                                                                type="date" required 
                                                                value={subDueDate} onChange={(e) => setSubDueDate(e.target.value)}
                                                                className={styles.moneyInput} style={{ fontSize: 12.5, padding: 8, height: 'auto' }}
                                                            />
                                                            <select 
                                                                value={subEnvelope} onChange={(e) => setSubEnvelope(e.target.value)}
                                                                style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: 8, padding: 8, fontSize: 12 }}
                                                            >
                                                                {currentEnvelopes.map(env => (
                                                                    <option key={env.name} value={env.name}>{env.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <button type="submit" className={styles.allocateBtn} style={{ margin: 0, padding: 8, fontSize: 12, background: 'var(--info)' }}>
                                                            Save Subscription
                                                        </button>
                                                    </form>
                                                )}

                                                {subscriptions.length === 0 ? (
                                                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, textAlign: 'center', padding: '16px 0' }}>No recurring bills active. Add items like Netflix or power utilities to track.</p>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
                                                        {subscriptions.map(sub => {
                                                            const diffDays = Math.ceil((new Date(sub.nextDueDate) - today) / (1000 * 60 * 60 * 24));
                                                            const isOverdue = diffDays < 0;
                                                            return (
                                                                <div key={sub.id} style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8 }}>
                                                                    <div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                            <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{sub.name}</span>
                                                                            <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>{sub.envelope}</span>
                                                                        </div>
                                                                        <span style={{ fontSize: 11, color: isOverdue ? '#EF4444' : 'var(--text-secondary)' }}>
                                                                            {isOverdue ? 'Overdue' : `Due in ${diffDays} days`} • {new Date(sub.nextDueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                        <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{currency}{sub.amount.toFixed(2)}</span>
                                                                        <button 
                                                                            onClick={() => paySubscription(sub.id)}
                                                                            style={{ background: 'var(--success)', border: 'none', borderRadius: 6, color: 'black', padding: '4px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                                                                            title="Pay Bill and Advance Date"
                                                                        >
                                                                            Pay Now
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => deleteSubscription(sub.id)}
                                                                            style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* SMART AI COACH INSIGHTS PANEL */}
                                        <div className={styles.card} style={{ 
                                            padding: 20, 
                                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%)',
                                            border: '1px solid rgba(139, 92, 246, 0.15)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', marginBottom: 16 }}>
                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: '#C084FC', margin: 0 }}>
                                                    <Brain size={18} /> Smart AI Financial Coach
                                                </h4>
                                                <span style={{ fontSize: 10, background: 'rgba(192, 132, 252, 0.2)', color: '#D8B4FE', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>ACTIVE</span>
                                            </div>

                                            {aiTips.length === 0 ? (
                                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>No dynamic tips generated. Continue logging activities to refine your personalized financial coaching.</p>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    {aiTips.map((tip, idx) => (
                                                        <div key={idx} style={{ 
                                                            display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', 
                                                            background: 'rgba(0, 0, 0, 0.2)', borderRadius: 8, borderLeft: `3px solid ${
                                                                tip.type === 'danger' || tip.type === 'warning' ? '#EF4444' : tip.type === 'alert' ? '#F59E0B' : tip.type === 'success' ? '#10B981' : '#8B5CF6'
                                                            }`
                                                        }}>
                                                            <Sparkles size={14} color="#C084FC" style={{ marginTop: 2, flexShrink: 0 }} />
                                                            <span style={{ fontSize: 12.5, lineHeight: 1.4, color: 'rgba(255,255,255,0.95)' }}>{tip.text}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column: Envelopes listing & Admin household control panels */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        
                                        {/* HOUSEHOLD ADMIN CONTROL PANEL */}
                                        {viewMode === 'household' && familyState?.role === 'admin' && (
                                            <div className={styles.card} style={{ padding: 20, background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                                                <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: '#EF4444', margin: 0 }}>
                                                        <Shield size={18} /> Administrative Controls Console
                                                    </h4>
                                                    <button 
                                                        onClick={() => setShowAdminConsole(!showAdminConsole)}
                                                        style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}
                                                    >
                                                        {showAdminConsole ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                </div>

                                                {showAdminConsole && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                                        <div>
                                                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Admin Spend Cap ({currency})</label>
                                                            <input 
                                                                type="number" value={adminSpendCeiling} 
                                                                onChange={(e) => setAdminSpendCeiling(e.target.value)}
                                                                className={styles.moneyInput} style={{ padding: 8, fontSize: 12.5, height: 'auto' }}
                                                            />
                                                        </div>

                                                        <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                            <div>
                                                                <span style={{ fontSize: 13, fontWeight: 600, color: 'white', display: 'block' }}>Lock Custom Envelopes</span>
                                                                <span style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>Disallow non-admin member modifications</span>
                                                            </div>
                                                            <button 
                                                                onClick={() => setCustomEnvelopeLock(!customEnvelopeLock)}
                                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
                                                            >
                                                                {customEnvelopeLock ? <Lock size={18} color="#EF4444" /> : <Unlock size={18} color="#666" />}
                                                            </button>
                                                        </div>

                                                        <div>
                                                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Velocity Alert Threshold ({velAlertThreshold}%)</label>
                                                            <input 
                                                                type="range" min="50" max="100" value={velAlertThreshold} 
                                                                onChange={(e) => setVelAlertThreshold(e.target.value)}
                                                                style={{ width: '100%', accentColor: '#EF4444', cursor: 'pointer' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <section className={styles.section} style={{ margin: 0 }}>
                                            <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                                <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Cash Envelope Budgets</h3>
                                                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{currentEnvelopes.length} Envelopes Active</span>
                                            </div>
                                            
                                            <div className={styles.envelopeGrid} style={{ gridTemplateColumns: '1fr' }}>
                                                {currentEnvelopes.map((env) => (
                                                    <EnvelopeCard 
                                                        key={env.name} 
                                                        env={env} 
                                                        currency={currency} 
                                                        isAdminView={selectedMemberId !== 'admin'}
                                                        onAdjustLimit={(name, lim) => adjustEnvelopeLimit(name, lim)}
                                                        onDeleteEnvelope={(name) => deleteCustomEnvelope(name)}
                                                        onToggleGoal={(name, isGoal, target, date) => toggleEnvelopeGoal(name, isGoal, target, date)}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            )}

                            {/* Recent Transactions Ledger & Report Export Panel */}
                            {!isPrivate && viewMode === 'personal' && selectedMemberId === 'admin' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    
                                    {/* Monthly Performance Analytics */}
                                    {transactions.length > 0 && (
                                        <div className={styles.card} style={{ padding: 20, background: 'rgba(255,255,255,0.01)' }}>
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>
                                                <FileSpreadsheet size={16} /> Budget Monthly Performance Report
                                            </h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                                                <div style={{ background: 'rgba(0,0,0,0.15)', padding: 14, borderRadius: 8 }}>
                                                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Envelope Utilization Rate</span>
                                                    <span style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>
                                                        {displayFinance.budgetLimit > 0 ? Math.round((totalActualSpending / displayFinance.budgetLimit) * 100) : 0}%
                                                    </span>
                                                </div>
                                                <div style={{ background: 'rgba(0,0,0,0.15)', padding: 14, borderRadius: 8 }}>
                                                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Subscriptions Forecast</span>
                                                    <span style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>
                                                        {currency}{subscriptions.reduce((acc, s) => acc + s.amount, 0).toFixed(2)}/mo
                                                    </span>
                                                </div>
                                                <div style={{ background: 'rgba(0,0,0,0.15)', padding: 14, borderRadius: 8 }}>
                                                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Savings Milestones Active</span>
                                                    <span style={{ fontSize: 18, fontWeight: 700, color: '#10B981' }}>
                                                        {envelopes.filter(e => e.isGoal).length} Active Goals
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* The Ledger Feed */}
                                    <div className={styles.card} style={{ padding: 24, border: '1px solid var(--glass-border)' }}>
                                        <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ padding: 6, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8 }}><Calendar size={18} color="var(--info)" /></div>
                                                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Recent Ledger Transactions</h3>
                                            </div>
                                            
                                            {/* Ledger Controls */}
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                                {/* Search */}
                                                <div style={{ position: 'relative' }}>
                                                    <Search size={14} color="#666" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                                                    <input 
                                                        type="text" 
                                                        placeholder="Search ledger..." 
                                                        value={txSearch} 
                                                        onChange={(e) => setTxSearch(e.target.value)}
                                                        className={styles.moneyInput}
                                                        style={{ width: 150, padding: '6px 10px 6px 30px', fontSize: 12, borderRadius: 8, height: 'auto' }}
                                                    />
                                                </div>

                                                {/* Filter */}
                                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Filter size={12} color="#666" />
                                                    <select 
                                                        value={txFilter} 
                                                        onChange={(e) => setTxFilter(e.target.value)}
                                                        style={{ 
                                                            background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--glass-border)', 
                                                            color: 'white', borderRadius: 8, padding: '4px 8px', fontSize: 12, cursor: 'pointer', outline: 'none'
                                                        }}
                                                    >
                                                        <option value="all">All Entries</option>
                                                        <option value="expense">Expenses</option>
                                                        <option value="income">Earnings</option>
                                                        <option value="system">Audit Logs</option>
                                                    </select>
                                                </div>

                                                {/* CSV Exporter */}
                                                <button
                                                    onClick={handleExportLedgerCSV}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 6,
                                                        background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)',
                                                        border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px 12px',
                                                        borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer'
                                                    }}
                                                >
                                                    <Download size={13} /> Export (CSV)
                                                </button>
                                            </div>
                                        </div>

                                        {/* Table view */}
                                        {filteredTransactions.length === 0 ? (
                                            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                <Search size={30} style={{ opacity: 0.2, marginBottom: 8 }} />
                                                <p style={{ fontSize: 13, margin: 0 }}>No matching transactions found in your records.</p>
                                            </div>
                                        ) : (
                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                    <thead>
                                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                            <th style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Date</th>
                                                            <th style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Envelope / Type</th>
                                                            <th style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Description</th>
                                                            <th style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'right' }}>Amount</th>
                                                            <th style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'center', width: 60 }}>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredTransactions.map((tx) => (
                                                            <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                                                <td style={{ padding: '12px', fontSize: 12.5 }}>
                                                                    {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at{' '}
                                                                    {new Date(tx.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                                </td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <span style={{ 
                                                                        fontSize: 10.5, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                                                                        background: tx.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : tx.type === 'system' ? 'rgba(255,255,255,0.07)' : 'rgba(59, 130, 246, 0.15)',
                                                                        color: tx.type === 'income' ? 'var(--success)' : tx.type === 'system' ? 'var(--text-secondary)' : 'var(--info)'
                                                                    }}>
                                                                        {tx.category}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '12px', fontSize: 12.5, color: tx.type === 'system' ? 'var(--text-secondary)' : 'white' }}>
                                                                    {tx.description}
                                                                </td>
                                                                <td style={{ 
                                                                    padding: '12px', fontSize: 13, fontWeight: 600, textAlign: 'right',
                                                                    color: tx.type === 'income' ? 'var(--success)' : tx.type === 'system' ? '#bbb' : '#EF4444'
                                                                }}>
                                                                    {tx.type === 'income' ? '+' : tx.type === 'system' ? '' : '-'}{currency}{Math.round(tx.amount).toLocaleString()}
                                                                </td>
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                    {tx.type !== 'system' && (
                                                                        <button 
                                                                            onClick={() => deleteTransaction(tx.id)}
                                                                            style={{ 
                                                                                background: 'transparent', border: 'none', color: '#666', cursor: 'pointer',
                                                                                transition: 'color 0.2s', padding: 4
                                                                            }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
                                                                            title="Reverse Entry"
                                                                        >
                                                                            <RotateCcw size={13} />
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                    <ResponsiveContainer width="100%" height="100%">
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

const EnvelopeCard = ({ env, currency, isAdminView, onAdjustLimit, onDeleteEnvelope, onToggleGoal }) => {
    const { spendFromEnvelope } = useFinance();
    
    const [isSpending, setIsSpending] = useState(false);
    const [spendAmount, setSpendAmount] = useState('');
    const [spendDescription, setSpendDescription] = useState('');
    
    const [isEditingSettings, setIsEditingSettings] = useState(false);
    const [editLimit, setEditLimit] = useState(env.limit.toString());

    // Savings Milestone Edit state
    const [isGoalMode, setIsGoalMode] = useState(env.isGoal || false);
    const [goalTarget, setGoalTarget] = useState(env.targetAmount?.toString() || '1000');
    const [goalDate, setGoalDate] = useState(env.targetDate || '');

    const percentage = env.isGoal 
        ? (env.current / (env.targetAmount || 1)) * 100 
        : (env.current / env.limit) * 100;
        
    const isLow = !env.isGoal && percentage < 20; // Warn if cash < 20% remaining

    // Calculate spent speed vs month pacing (Warning Velocity)
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const monthRatio = dayOfMonth / daysInMonth;
    const spentRatio = env.limit > 0 ? (env.limit - env.current) / env.limit : 0;
    
    // Warn if spending exceeds month timeline by 15%
    const isHighVelocity = !env.isGoal && spentRatio > monthRatio + 0.15 && env.current > 0;

    const handleSpend = () => {
        const amt = parseFloat(spendAmount);
        if (isNaN(amt) || amt <= 0) return;
        
        spendFromEnvelope(env.name, amt, spendDescription);
        setIsSpending(false);
        setSpendAmount('');
        setSpendDescription('');
    };

    const handleSaveLimit = () => {
        const lim = parseFloat(editLimit);
        if (isNaN(lim) || lim <= 0) return;
        
        onAdjustLimit(env.name, lim);
        setIsEditingSettings(false);
    };

    const handleSaveGoal = () => {
        const target = parseFloat(goalTarget);
        if (isNaN(target) || target <= 0) return;

        onToggleGoal(env.name, isGoalMode, target, goalDate);
        setIsEditingSettings(false);
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete the "${env.name}" envelope?\nIts remaining balance will be removed from your budget.`)) {
            onDeleteEnvelope(env.name);
        }
    };

    return (
        <div className={styles.envelopeCard} style={{ 
            boxShadow: isHighVelocity ? '0 0 12px rgba(245, 158, 11, 0.1)' : 'none',
            border: isHighVelocity ? '1px solid rgba(245, 158, 11, 0.2)' : env.isGoal ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--glass-border)'
        }}>
            <div className={styles.envHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{env.name}</span>
                    
                    {env.isGoal ? (
                        <span 
                            title="Savings Goal Milestone Active" 
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5, 
                                background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', 
                                padding: '2px 6px', borderRadius: 4, fontWeight: 700 
                            }}
                        >
                            <CalendarDays size={10} /> Savings Goal
                        </span>
                    ) : isHighVelocity && (
                        <span 
                            title="Spending velocity exceeds month pacing" 
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5, 
                                background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', 
                                padding: '2px 6px', borderRadius: 4, fontWeight: 700 
                            }}
                        >
                            <AlertTriangle size={10} /> Fast Depletion
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={styles.envAmount} style={{ opacity: isSpending || isEditingSettings ? 0.3 : 1, fontWeight: 600 }}>
                        {env.isGoal ? (
                            `Saved: ${currency}${Math.round(env.current).toLocaleString()} / ${currency}${Math.round(env.targetAmount).toLocaleString()}`
                        ) : (
                            `${currency}${Math.round(env.current).toLocaleString()} / ${currency}${Math.round(env.limit).toLocaleString()} left`
                        )}
                    </span>
                    {!isAdminView && (
                        <button 
                            onClick={() => { setIsEditingSettings(!isEditingSettings); setIsSpending(false); }}
                            style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', display: 'flex' }}
                            title="Envelope Settings"
                        >
                            <Settings size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar (Remaining or Saved towards Target) */}
            <div className={styles.progressBar} style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                    className={styles.progressFill}
                    style={{
                        width: `${Math.min(percentage, 100)}%`,
                        background: env.isGoal ? '#10B981' : isLow ? '#EF4444' : env.color,
                        boxShadow: env.isGoal ? '0 0 8px rgba(16, 185, 129, 0.3)' : isLow ? '0 0 8px rgba(239, 68, 68, 0.3)' : 'none',
                        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s'
                    }}
                />
            </div>

            {/* Goal Timeline / Target dates description */}
            {env.isGoal && env.targetDate && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CalendarDays size={10} /> Target deadline: {new Date(env.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            )}

            {/* Inline limits & Goal configuration edit */}
            {isEditingSettings && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14, background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>Configure Envelope</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Savings Goal:</span>
                            <input 
                                type="checkbox" checked={isGoalMode} onChange={(e) => setIsGoalMode(e.target.checked)}
                                style={{ accentColor: '#10B981', cursor: 'pointer' }}
                            />
                        </div>
                    </div>

                    {isGoalMode ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div className={styles.goalInputGroup}>
                                <input
                                    type="number" placeholder="Target Savings"
                                    className={styles.moneyInput} style={{ fontSize: 12, padding: 6, height: 'auto' }}
                                    value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)}
                                />
                                <input
                                    type="date"
                                    className={styles.moneyInput} style={{ fontSize: 12, padding: 6, height: 'auto' }}
                                    value={goalDate} onChange={(e) => setGoalDate(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleSaveGoal}
                                style={{ background: '#10B981', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', color: 'black', fontSize: 12, fontWeight: 600 }}
                            >
                                Apply Savings Goal
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <input
                                    type="number"
                                    placeholder="Target Budget"
                                    className={styles.moneyInput}
                                    style={{ width: 80, height: 28, fontSize: 12, padding: '0 8px' }}
                                    value={editLimit}
                                    onChange={(e) => setEditLimit(e.target.value)}
                                />
                                <button
                                    onClick={handleSaveLimit}
                                    style={{ background: 'var(--info)', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', display: 'flex', color: 'white', fontSize: 11, fontWeight: 600 }}
                                >
                                    Save
                                </button>
                            </div>
                            
                            {env.name !== 'Needs' && env.name !== 'Wants' && env.name !== 'Savings' && (
                                <button 
                                    onClick={handleDelete}
                                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '4px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                    <Trash2 size={10} /> Delete
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Interaction Area */}
            <div style={{ marginTop: 12, minHeight: 30, display: 'flex', justifycontent: 'flex-end' }}>
                {isSpending ? (
                    <div className={styles.logExpenseForm}>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Merchant / Purpose"
                            className={`${styles.moneyInput} ${styles.logExpenseDesc}`}
                            value={spendDescription}
                            onChange={(e) => setSpendDescription(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="Amount"
                            className={`${styles.moneyInput} ${styles.logExpenseAmount}`}
                            value={spendAmount}
                            onChange={(e) => setSpendAmount(e.target.value)}
                        />
                        <div className={styles.logExpenseActions}>
                            <button
                                onClick={handleSpend}
                                className={styles.logExpenseConfirmBtn}
                                title="Confirm Expense"
                            >
                                <Check size={14} color="white" />
                            </button>
                            <button
                                onClick={() => { setIsSpending(false); setSpendAmount(''); setSpendDescription(''); }}
                                className={styles.logExpenseCancelBtn}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    !isAdminView && (
                        <button
                            onClick={() => { setIsSpending(true); setIsEditingSettings(false); }}
                            className={styles.spendBtn}
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
                    )
                )}
            </div>
        </div>
    );
};

export default FinanceDashboard;
