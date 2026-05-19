import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

const HealthContext = createContext();

export const useHealth = () => useContext(HealthContext);

export const HealthProvider = ({ children }) => {
    const { currentUser } = useAuth();

    // Default State (Fallback if offline or loading)
    const [healthState, setHealthState] = useState({
        steps: null,
        targetSteps: 10000,
        heartRate: null,
        sleep: null,
        sleepQuality: null,
        score: null,
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

    // 2. Function to Update Health (Also writes to Firestore using recursive dot-notation update)
    const updateHealth = async (updates) => {
        // Optimistic UI update using functional state to prevent stale closures
        setHealthState(prev => {
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                
                // Formulate dot-notation updates so we update targeted nested fields without wiping out others
                const firestoreUpdates = {};
                Object.keys(updates).forEach(key => {
                    firestoreUpdates[`health.${key}`] = updates[key];
                });

                updateDoc(userDocRef, firestoreUpdates)
                    .catch(e => {
                        console.warn("updateDoc failed, document might not exist yet. Falling back to setDoc.", e);
                        // Fallback to initialize document
                        setDoc(userDocRef, { health: updates }, { merge: true })
                            .catch(err => console.error("setDoc fallback failed:", err));
                    });
            }
            return { ...prev, ...updates };
        });
    };

    const updateProfile = async (profileUpdates) => {
        setHealthState(prev => {
            const newProfile = { ...prev.profile, ...profileUpdates };
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                
                // Use nested dot-notation to avoid wiping out other health fields!
                updateDoc(userDocRef, { 'health.profile': newProfile })
                    .catch(e => {
                        console.warn("updateDoc failed, document might not exist yet. Falling back to setDoc.", e);
                        setDoc(userDocRef, { health: { profile: newProfile } }, { merge: true })
                            .catch(err => console.error("setDoc profile fallback failed:", err));
                    });
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
