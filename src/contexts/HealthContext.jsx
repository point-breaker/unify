import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const HealthContext = createContext();

export const useHealth = () => useContext(HealthContext);

export const HealthProvider = ({ children }) => {
    const { currentUser } = useAuth();

    // Default State (Fallback if offline or loading)
    const [healthState, setHealthState] = useState({
        steps: 0,
        targetSteps: 10000,
        heartRate: 0,
        sleep: '--',
        sleepQuality: '--',
        score: 0,
        profile: {
            name: 'User',
            height: '',
            weight: '',
            gender: 'male',
            dob: '',
            goal: 'maintain',
            conditions: ''
        }
    });

    // 1. Sync from Firestore when Component Mounts / User Changes
    useEffect(() => {
        if (!currentUser) return;

        const userDocRef = doc(db, 'users', currentUser.uid);

        // Listen to real-time updates
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.health) {
                    setHealthState(prev => ({ ...prev, ...data.health }));
                }
            } else {
                // Determine if we should create a new doc or leave empty
                console.log("No user data yet");
            }
        });

        return () => unsubscribe();
    }, [currentUser]);

    // 2. Function to Update Health (Also writes to Firestore)
    const updateHealth = async (updates) => {
        // Optimistic UI update using functional state to prevent stale closures
        setHealthState(prev => {
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                // Selective merge: only upload specified fields, never the entire stale state
                setDoc(userDocRef, { health: updates }, { merge: true })
                    .catch(e => console.error("Error syncing health:", e));
            }
            return { ...prev, ...updates };
        });
    };

    const updateProfile = async (profileUpdates) => {
        setHealthState(prev => {
            const newProfile = { ...prev.profile, ...profileUpdates };
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                // Sync the nested profile map directly into Firestore
                setDoc(userDocRef, { health: { profile: newProfile } }, { merge: true })
                    .catch(e => console.error("Error syncing profile:", e));
            }
            return { ...prev, profile: newProfile };
        });
    };

    return (
        <HealthContext.Provider value={{ healthState, updateHealth, updateProfile }}>
            {children}
        </HealthContext.Provider>
    );
};
