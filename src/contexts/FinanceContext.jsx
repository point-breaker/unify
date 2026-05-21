import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
    const { currentUser } = useAuth();

    // Default / Fallback State
    const [financeState, setFinanceState] = useState({
        netWorth: 0,
        monthlySpending: 0,
        budgetLimit: 0,
        isBudgetOnTrack: true,
        envelopes: [],
        transactions: [],
        subscriptions: []
    });

    // 1. Sync from Firestore
    useEffect(() => {
        if (!currentUser) return;

        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.finance) {
                    setFinanceState(prev => ({
                        ...prev,
                        ...data.finance,
                        envelopes: data.finance.envelopes || [],
                        transactions: data.finance.transactions || [],
                        subscriptions: data.finance.subscriptions || []
                    }));
                }
            }
        });
        return () => unsubscribe();
    }, [currentUser]);

    // 2. Actions with Sync
    const updateFinance = async (updates) => {
        setFinanceState(prev => {
            const newState = { ...prev, ...updates };
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                // Perform a selective merge upload, preventing stale scope overwrites
                setDoc(userDocRef, { finance: updates }, { merge: true })
                    .catch(e => console.error("Error syncing finance:", e));
            }
            return newState;
        });
    };

    const spendFromEnvelope = async (envelopeName, amount, description = '') => {
        setFinanceState(prev => {
            const parsedAmount = parseFloat(amount) || 0;
            const newEnvelopes = prev.envelopes.map(env => {
                if (env.name === envelopeName) {
                    const newCurrent = Math.max(0, env.current - parsedAmount);
                    return { ...env, current: newCurrent };
                }
                return env;
            });

            const newSpending = prev.monthlySpending + parsedAmount;
            const isOnTrack = newSpending < prev.budgetLimit;

            const newTx = {
                id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                date: new Date().toISOString(),
                amount: parsedAmount,
                type: 'expense',
                category: envelopeName,
                description: description.trim() || 'Logged Expense'
            };

            const updatedTransactions = [newTx, ...(prev.transactions || [])];

            const newState = {
                ...prev,
                envelopes: newEnvelopes,
                monthlySpending: newSpending,
                isBudgetOnTrack: isOnTrack,
                transactions: updatedTransactions
            };

            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                setDoc(userDocRef, { finance: newState }, { merge: true })
                    .catch(e => console.error("Error syncing expense:", e));
            }

            return newState;
        });
    };

    const logIncome = async (amount, description = '') => {
        setFinanceState(prev => {
            const parsedAmount = parseFloat(amount) || 0;
            const newNetWorth = prev.netWorth + parsedAmount;

            const newTx = {
                id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                date: new Date().toISOString(),
                amount: parsedAmount,
                type: 'income',
                category: 'Income',
                description: description.trim() || 'Salary / General Income'
            };

            const updatedTransactions = [newTx, ...(prev.transactions || [])];

            const newState = {
                ...prev,
                netWorth: newNetWorth,
                transactions: updatedTransactions
            };

            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                setDoc(userDocRef, { finance: newState }, { merge: true })
                    .catch(e => console.error("Error syncing income:", e));
            }

            return newState;
        });
    };

    const addCustomEnvelope = async (name, limit, color) => {
        setFinanceState(prev => {
            const parsedLimit = parseFloat(limit) || 0;
            // Check if envelope already exists
            if (prev.envelopes.some(env => env.name.toLowerCase() === name.toLowerCase())) {
                return prev;
            }

            const newEnvelope = {
                name,
                limit: parsedLimit,
                current: parsedLimit,
                color: color || '#3B82F6',
                isGoal: false,
                targetAmount: 0,
                targetDate: ''
            };

            const newEnvelopes = [...prev.envelopes, newEnvelope];
            const newBudgetLimit = prev.budgetLimit + parsedLimit;
            const isOnTrack = prev.monthlySpending < newBudgetLimit;

            const newTx = {
                id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                date: new Date().toISOString(),
                amount: parsedLimit,
                type: 'system',
                category: name,
                description: `Created custom envelope: ${name}`
            };

            const updatedTransactions = [newTx, ...(prev.transactions || [])];

            const newState = {
                ...prev,
                envelopes: newEnvelopes,
                budgetLimit: newBudgetLimit,
                isBudgetOnTrack: isOnTrack,
                transactions: updatedTransactions
            };

            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                setDoc(userDocRef, { finance: newState }, { merge: true })
                    .catch(e => console.error("Error syncing custom envelope:", e));
            }

            return newState;
        });
    };

    const deleteCustomEnvelope = async (envelopeName) => {
        setFinanceState(prev => {
            const targetEnv = prev.envelopes.find(env => env.name === envelopeName);
            if (!targetEnv) return prev;

            const newEnvelopes = prev.envelopes.filter(env => env.name !== envelopeName);
            const newBudgetLimit = Math.max(0, prev.budgetLimit - targetEnv.limit);
            const newSpending = Math.max(0, prev.monthlySpending - (targetEnv.limit - targetEnv.current));
            const isOnTrack = newSpending < newBudgetLimit;

            const newTx = {
                id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                date: new Date().toISOString(),
                amount: targetEnv.limit,
                type: 'system',
                category: envelopeName,
                description: `Deleted envelope: ${envelopeName}`
            };

            const updatedTransactions = [newTx, ...(prev.transactions || [])];

            const newState = {
                ...prev,
                envelopes: newEnvelopes,
                budgetLimit: newBudgetLimit,
                monthlySpending: newSpending,
                isBudgetOnTrack: isOnTrack,
                transactions: updatedTransactions
            };

            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                setDoc(userDocRef, { finance: newState }, { merge: true })
                    .catch(e => console.error("Error syncing envelope deletion:", e));
            }

            return newState;
        });
    };

    const adjustEnvelopeLimit = async (envelopeName, newLimit) => {
        setFinanceState(prev => {
            const parsedLimit = parseFloat(newLimit) || 0;
            const targetEnv = prev.envelopes.find(env => env.name === envelopeName);
            if (!targetEnv) return prev;

            const diff = parsedLimit - targetEnv.limit;

            const newEnvelopes = prev.envelopes.map(env => {
                if (env.name === envelopeName) {
                    const newCurrent = Math.max(0, env.current + diff);
                    return { ...env, limit: parsedLimit, current: newCurrent };
                }
                return env;
            });

            const newBudgetLimit = Math.max(0, prev.budgetLimit + diff);
            const isOnTrack = prev.monthlySpending < newBudgetLimit;

            const newTx = {
                id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                date: new Date().toISOString(),
                amount: Math.abs(diff),
                type: 'system',
                category: envelopeName,
                description: `Adjusted budget: ${diff >= 0 ? '+' : '-'}${currencySymbol()}${Math.abs(diff).toFixed(0)}`
            };

            const updatedTransactions = [newTx, ...(prev.transactions || [])];

            const newState = {
                ...prev,
                envelopes: newEnvelopes,
                budgetLimit: newBudgetLimit,
                isBudgetOnTrack: isOnTrack,
                transactions: updatedTransactions
            };

            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                setDoc(userDocRef, { finance: newState }, { merge: true })
                    .catch(e => console.error("Error syncing envelope limit adjustment:", e));
            }

            return newState;
        });
    };

    const deleteTransaction = async (txId) => {
        setFinanceState(prev => {
            const tx = prev.transactions.find(t => t.id === txId);
            if (!tx) return prev;

            let updatedEnvelopes = [...prev.envelopes];
            let updatedSpending = prev.monthlySpending;
            let updatedNetWorth = prev.netWorth;

            if (tx.type === 'expense') {
                // Reverse expense: add spent amount back to the envelope, subtract from monthly spending
                updatedEnvelopes = prev.envelopes.map(env => {
                    if (env.name === tx.category) {
                        return { ...env, current: env.current + tx.amount };
                    }
                    return env;
                });
                updatedSpending = Math.max(0, prev.monthlySpending - tx.amount);
            } else if (tx.type === 'income') {
                // Reverse income: subtract from net worth
                updatedNetWorth = Math.max(0, prev.netWorth - tx.amount);
            }

            const updatedTransactions = prev.transactions.filter(t => t.id !== txId);
            const isOnTrack = updatedSpending < prev.budgetLimit;

            const newState = {
                ...prev,
                envelopes: updatedEnvelopes,
                monthlySpending: updatedSpending,
                netWorth: updatedNetWorth,
                isBudgetOnTrack: isOnTrack,
                transactions: updatedTransactions
            };

            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                setDoc(userDocRef, { finance: newState }, { merge: true })
                    .catch(e => console.error("Error syncing transaction reversion:", e));
            }

            return newState;
        });
    };

    const addSubscription = async (name, amount, dueDate, envelopeName) => {
        setFinanceState(prev => {
            const parsedAmount = parseFloat(amount) || 0;
            const newSub = {
                id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: name.trim(),
                amount: parsedAmount,
                nextDueDate: dueDate,
                envelope: envelopeName
            };
            const newState = {
                ...prev,
                subscriptions: [...(prev.subscriptions || []), newSub]
            };
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                setDoc(userDocRef, { finance: newState }, { merge: true })
                    .catch(e => console.error("Error syncing subscriptions:", e));
            }
            return newState;
        });
    };

    const deleteSubscription = async (subId) => {
        setFinanceState(prev => {
            const newState = {
                ...prev,
                subscriptions: (prev.subscriptions || []).filter(sub => sub.id !== subId)
            };
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                setDoc(userDocRef, { finance: newState }, { merge: true })
                    .catch(e => console.error("Error syncing subscriptions deletion:", e));
            }
            return newState;
        });
    };

    const paySubscription = async (subId) => {
        setFinanceState(prev => {
            const sub = (prev.subscriptions || []).find(s => s.id === subId);
            if (!sub) return prev;

            const parsedAmount = sub.amount;
            const envelopeName = sub.envelope;
            const newEnvelopes = prev.envelopes.map(env => {
                if (env.name === envelopeName) {
                    const newCurrent = Math.max(0, env.current - parsedAmount);
                    return { ...env, current: newCurrent };
                }
                return env;
            });

            const newSpending = prev.monthlySpending + parsedAmount;
            const isOnTrack = newSpending < prev.budgetLimit;

            const newTx = {
                id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                date: new Date().toISOString(),
                amount: parsedAmount,
                type: 'expense',
                category: envelopeName,
                description: `Paid subscription: ${sub.name}`
            };

            const updatedTransactions = [newTx, ...(prev.transactions || [])];

            // Advance due date by 1 month
            const currentDueDate = new Date(sub.nextDueDate);
            currentDueDate.setMonth(currentDueDate.getMonth() + 1);
            const nextDueDateStr = currentDueDate.toISOString().split('T')[0];

            const newSubscriptions = prev.subscriptions.map(s => {
                if (s.id === subId) {
                    return { ...s, nextDueDate: nextDueDateStr };
                }
                return s;
            });

            const newState = {
                ...prev,
                envelopes: newEnvelopes,
                monthlySpending: newSpending,
                isBudgetOnTrack: isOnTrack,
                transactions: updatedTransactions,
                subscriptions: newSubscriptions
            };

            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                setDoc(userDocRef, { finance: newState }, { merge: true })
                    .catch(e => console.error("Error syncing subscription payment:", e));
            }

            return newState;
        });
    };

    const toggleEnvelopeGoal = async (envelopeName, isGoal, targetAmount = 0, targetDate = '') => {
        setFinanceState(prev => {
            const parsedAmount = parseFloat(targetAmount) || 0;
            const newEnvelopes = prev.envelopes.map(env => {
                if (env.name === envelopeName) {
                    return {
                        ...env,
                        isGoal: !!isGoal,
                        targetAmount: parsedAmount,
                        targetDate: targetDate || ''
                    };
                }
                return env;
            });

            const newTx = {
                id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                date: new Date().toISOString(),
                amount: 0,
                type: 'system',
                category: envelopeName,
                description: isGoal 
                    ? `Converted envelope to Savings Milestone: Target $${parsedAmount}` 
                    : `Converted Savings Milestone back to standard limit`
            };

            const updatedTransactions = [newTx, ...(prev.transactions || [])];

            const newState = {
                ...prev,
                envelopes: newEnvelopes,
                transactions: updatedTransactions
            };

            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                setDoc(userDocRef, { finance: newState }, { merge: true })
                    .catch(e => console.error("Error syncing goal configuration:", e));
            }

            return newState;
        });
    };

    const currencySymbol = () => '$';

    return (
        <FinanceContext.Provider value={{
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
        }}>
            {children}
        </FinanceContext.Provider>
    );
};
