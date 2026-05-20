import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { pedometerEngine } from '../modules/health/PedometerEngine';

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

    // ─── Global Live Hardware Tracking State ───
    const [isPedometerActive, setIsPedometerActive] = useState(false);
    const [liveSteps, setLiveSteps] = useState(0);
    const [liveCalories, setLiveCalories] = useState(0);
    const pedometerSaveTimer = useRef(null);
    const baseStepsRef = useRef(0);

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

    // ─── Global Pedometer Controls ───
    const startPedometer = async () => {
        const weight = healthState.profile?.weight || 70;
        baseStepsRef.current = healthState.steps || 0;
        const success = await pedometerEngine.start((data) => {
            setLiveSteps(data.steps);
            setLiveCalories(data.calories);
        }, weight);

        if (success) {
            setIsPedometerActive(true);
            // Auto-save to Firestore every 30 seconds
            pedometerSaveTimer.current = setInterval(() => {
                const snap = pedometerEngine.getSnapshot();
                if (snap.steps > 0) {
                    updateHealth({ steps: baseStepsRef.current + snap.steps });
                }
            }, 30000);
        } else {
            alert('Step tracking requires a mobile device with motion sensors (Chrome on Android).\n\nOn desktop, use Google Fit sync or manual entry instead.');
        }
    };

    const stopPedometer = () => {
        const snap = pedometerEngine.getSnapshot();
        const finalSteps = baseStepsRef.current + snap.steps;
        
        if (snap.steps > 0) {
            updateHealth({ steps: finalSteps });
        }
        pedometerEngine.stop();
        pedometerEngine.reset();
        setIsPedometerActive(false);
        setLiveSteps(0);
        setLiveCalories(0);
        if (pedometerSaveTimer.current) {
            clearInterval(pedometerSaveTimer.current);
            pedometerSaveTimer.current = null;
        }
    };

    // Auto-cleanup on logout
    useEffect(() => {
        if (!currentUser) {
            if (pedometerEngine.isActive) {
                pedometerEngine.stop();
                pedometerEngine.reset();
            }
            Promise.resolve().then(() => {
                setIsPedometerActive(false);
                setLiveSteps(0);
                setLiveCalories(0);
            });
            if (pedometerSaveTimer.current) {
                clearInterval(pedometerSaveTimer.current);
                pedometerSaveTimer.current = null;
            }
        }
    }, [currentUser]);

    const displaySteps = isPedometerActive ? (baseStepsRef.current + liveSteps) : healthState.steps;

    return (
        <HealthContext.Provider value={{ 
            healthState: { ...healthState, steps: displaySteps }, 
            updateHealth, updateProfile,
            isPedometerActive, liveSteps, liveCalories, startPedometer, stopPedometer 
        }}>
            {children}
        </HealthContext.Provider>
    );
};
