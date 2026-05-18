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
        envelopes: []
    });

    // 1. Sync from Firestore
    useEffect(() => {
        if (!currentUser) return;

        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.finance) {
                    setFinanceState(prev => ({ ...prev, ...data.finance }));
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

    const spendFromEnvelope = async (envelopeName, amount) => {
        setFinanceState(prev => {
            const newEnvelopes = prev.envelopes.map(env => {
                if (env.name === envelopeName) {
                    const newCurrent = Math.max(0, env.current - parseFloat(amount));
                    return { ...env, current: newCurrent };
                }
                return env;
            });

            const newSpending = prev.monthlySpending + parseFloat(amount);
            const isOnTrack = newSpending < prev.budgetLimit;

            const newState = {
                ...prev,
                envelopes: newEnvelopes,
                monthlySpending: newSpending,
                isBudgetOnTrack: isOnTrack
            };

            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                setDoc(userDocRef, { finance: newState }, { merge: true })
                    .catch(e => console.error("Error syncing expense:", e));
            }

            return newState;
        });
    };

    return (
        <FinanceContext.Provider value={{ financeState, updateFinance, spendFromEnvelope }}>
            {children}
        </FinanceContext.Provider>
    );
};
