import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { pedometerEngine } from '../modules/health/PedometerEngine';

const HealthContext = createContext();

export const useHealth = () => useContext(HealthContext);

// --- MOCK DATABASE HELPERS (Fallback for offline/non-auth demo) ---
const DB_KEY = 'unify_db';
const SESSION_KEY = 'unify_session';
const getDB = () => { try { return JSON.parse(localStorage.getItem(DB_KEY) || '{}'); } catch { return {}; } };
const getSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '{}'); } catch { return {}; } };
const saveDB = (db) => { localStorage.setItem(DB_KEY, JSON.stringify(db)); window.dispatchEvent(new Event('storage')); };

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
    const [baseSteps, setBaseSteps] = useState(0);

    // ─── Transition Buffer for Pedometer Stop ───
    const [lastStepsRecord, setLastStepsRecord] = useState(null);

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

    // 1b. Sync from localStorage when not authenticated (Local Fallback Mode)
    useEffect(() => {
        if (currentUser) return;

        const rehydrate = () => {
            const session = getSession();
            const localDB = getDB();
            if (session.familyCode && localDB[session.familyCode]) {
                const family = localDB[session.familyCode];
                const member = family.members?.find(m => m.id === session.myId);
                if (member && member.health) {
                    setHealthState(prev => ({ ...prev, ...member.health }));
                }
            }
        };

        rehydrate();
        window.addEventListener('storage', rehydrate);
        return () => window.removeEventListener('storage', rehydrate);
    }, [currentUser]);

    // ─── Auto-clear Transition Buffer is handled declaratively in displaySteps ───

    // 2. Function to Update Health (Also writes to Firestore or localStorage using recursive dot-notation update)
    const updateHealth = async (updates) => {
        setHealthState(prev => {
            // Trigger Firestore/localStorage update asynchronously outside the synchronous render/commit phase
            Promise.resolve().then(async () => {
                if (currentUser) {
                    // Accumulate pending cloud updates to save daily Firebase Free Tier Quota (20k writes/day)
                    if (!window.__pendingCloudUpdates) window.__pendingCloudUpdates = {};
                    
                    Object.keys(updates).forEach(key => {
                        window.__pendingCloudUpdates[`health.${key}`] = updates[key];
                    });

                    // If a sync is already scheduled, don't schedule another one
                    if (window.__cloudSyncTimeout) return;

                    // Schedule a batch sync every 15 seconds
                    window.__cloudSyncTimeout = setTimeout(async () => {
                        const updatesToSync = { ...window.__pendingCloudUpdates };
                        window.__pendingCloudUpdates = {}; // Clear for next batch
                        window.__cloudSyncTimeout = null;

                        const userDocRef = doc(db, 'users', currentUser.uid);
                        try {
                            await updateDoc(userDocRef, updatesToSync);
                        } catch (e) {
                            console.warn("updateDoc failed, document might not exist yet. Falling back to setDoc.", e);
                            try {
                                const fallbackHealth = {};
                                Object.keys(updatesToSync).forEach(k => {
                                    fallbackHealth[k.replace('health.', '')] = updatesToSync[k];
                                });
                                await setDoc(userDocRef, { health: fallbackHealth }, { merge: true });
                            } catch (err) {
                                console.error("setDoc fallback failed:", err);
                            }
                        }
                    }, 15000);
                } else {
                    // Local Fallback mode - save to localStorage immediately
                    const session = getSession();
                    if (session.familyCode && session.myId) {
                        const localDB = getDB();
                        const family = localDB[session.familyCode];
                        if (family && family.members) {
                            const idx = family.members.findIndex(m => m.id === session.myId);
                            if (idx !== -1) {
                                family.members[idx].health = {
                                    ...(family.members[idx].health || {}),
                                    ...updates
                                };
                                localDB[session.familyCode] = family;
                                saveDB(localDB);
                            }
                        }
                    }
                }
            });

            return { ...prev, ...updates };
        });
    };

    const updateProfile = async (profileUpdates) => {
        setHealthState(prev => {
            const newProfile = { ...prev.profile, ...profileUpdates };

            // Trigger Firestore/localStorage update asynchronously outside the synchronous render/commit phase
            Promise.resolve().then(async () => {
                if (currentUser) {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    
                    try {
                        await updateDoc(userDocRef, { 'health.profile': newProfile });
                    } catch (e) {
                        console.warn("updateDoc failed, document might not exist yet. Falling back to setDoc.", e);
                        try {
                            await setDoc(userDocRef, { health: { profile: newProfile } }, { merge: true });
                        } catch (err) {
                            console.error("setDoc profile fallback failed:", err);
                        }
                    }
                } else {
                    // Local Fallback mode - save to localStorage
                    const session = getSession();
                    if (session.familyCode && session.myId) {
                        const localDB = getDB();
                        const family = localDB[session.familyCode];
                        if (family && family.members) {
                            const idx = family.members.findIndex(m => m.id === session.myId);
                            if (idx !== -1) {
                                family.members[idx].health = {
                                    ...(family.members[idx].health || {}),
                                    profile: newProfile
                                };
                                localDB[session.familyCode] = family;
                                saveDB(localDB);
                            }
                        }
                    }
                }
            });

            return { ...prev, profile: newProfile };
        });
    };

    // ─── Global Pedometer Controls ───
    const startPedometer = async (currentSteps) => {
        const weight = healthState.profile?.weight || 70;
        
        // Clear transition buffer when starting tracking
        setLastStepsRecord(null);

        // Ensure baseline steps are resolved to current steps (fallback to local DB/session if healthState steps is null)
        let resolvedSteps = typeof currentSteps === 'number' && !isNaN(currentSteps) ? currentSteps : null;
        if (resolvedSteps === null) {
            resolvedSteps = typeof healthState.steps === 'number' && !isNaN(healthState.steps) ? healthState.steps : null;
        }
        if (resolvedSteps === null) {
            const session = getSession();
            const localDB = getDB();
            if (session.familyCode && localDB[session.familyCode]) {
                const family = localDB[session.familyCode];
                const member = family.members?.find(m => m.id === session.myId);
                resolvedSteps = member?.health?.steps || 0;
            } else {
                resolvedSteps = 0;
            }
        }
        
        baseStepsRef.current = resolvedSteps;
        setBaseSteps(resolvedSteps);
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

    const stopPedometer = (onStopCallback) => {
        const snap = pedometerEngine.getSnapshot();
        const finalSteps = baseStepsRef.current + snap.steps;
        
        // Save the final steps in the transition buffer to prevent a temporary drop to zero/old baseline
        setLastStepsRecord(finalSteps);

        // Always update steps and execute callback to guarantee sync to leaderboard/challenges
        updateHealth({ steps: finalSteps });
        if (typeof onStopCallback === 'function') {
            onStopCallback(finalSteps);
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
                setLastStepsRecord(null);
            });
            if (pedometerSaveTimer.current) {
                clearInterval(pedometerSaveTimer.current);
                pedometerSaveTimer.current = null;
            }
        }
    }, [currentUser]);

    let displaySteps = healthState.steps;
    if (isPedometerActive) {
        displaySteps = baseSteps + liveSteps;
    } else if (lastStepsRecord !== null) {
        if (healthState.steps !== null && healthState.steps >= lastStepsRecord) {
            displaySteps = healthState.steps;
        } else {
            displaySteps = lastStepsRecord;
        }
    }

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
