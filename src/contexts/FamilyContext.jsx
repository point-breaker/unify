

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { useHealth } from './HealthContext';

const FamilyContext = createContext();

export const useFamily = () => useContext(FamilyContext);

// --- MOCK DATABASE HELPERS (Fallback for offline/non-auth demo) ---
const DB_KEY = 'unify_db';
const SESSION_KEY = 'unify_session';
const getDB = () => { try { return JSON.parse(localStorage.getItem(DB_KEY) || '{}'); } catch { return {}; } };
const saveDB = (db) => { localStorage.setItem(DB_KEY, JSON.stringify(db)); window.dispatchEvent(new Event('storage')); };
const getSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '{}'); } catch { return {}; } };
const saveSession = (session) => { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); window.dispatchEvent(new Event('storage')); };

// Keep track of the last sync promise to chain them sequentially (preventing race conditions)
let activeSyncPromise = Promise.resolve();

// Utility to prevent Firebase from hanging indefinitely on Quota Exceeded (Resource Exhausted)
const withTimeout = (promise, ms, errorMessage) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage)), ms))
    ]);
};

export const FamilyProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const { healthState } = useHealth();

    // Internal helper to sync specific data to family doc with sequential queuing
    async function syncUserStatsToFamily(familyCode, uid, type, data) {
        activeSyncPromise = activeSyncPromise.then(async () => {
            try {
                const familyRef = doc(db, 'families', familyCode);
                // Read fresh to avoid race in 'members' array
                const familySnap = await getDoc(familyRef);
                if (!familySnap.exists()) return;

                const famData = familySnap.data();
                const members = famData.members || [];

                let changed = false;
                const updatedMembers = members.map(m => {
                    if (m.id === uid) {
                        const existingData = m[type] || {};
                        const mergedData = { ...existingData, ...data };
                        // Check if actually different to avoid write loops
                        if (JSON.stringify(existingData) !== JSON.stringify(mergedData)) {
                            changed = true;
                            return { ...m, [type]: mergedData };
                        }
                    }
                    return m;
                });

                if (changed) {
                    await updateDoc(familyRef, { members: updatedMembers });
                }
            } catch (e) {
                console.error("Sync to family failed:", e);
            }
        });

        // Wait for this specific sync operation to complete
        await activeSyncPromise;
    }

    // We derive 'familyState' from the DB + Session
    const [familyState, setFamilyState] = useState({
        subscription: { status: 'free', tier: 'free' },
        role: null, // 'admin' | 'member' | null
        familyCode: '',
        members: [],
        challenges: []
    });

    const [userFamilyCode, setUserFamilyCode] = useState(null);

    // --- REHYDRATE STATE (Hybrid: Firestore OR LocalStorage) ---
    // Hook 1: Listen to User Document for Family Code & Stats Sync
    useEffect(() => {
        if (!currentUser) {
            Promise.resolve().then(() => setUserFamilyCode(null));
            return;
        }

        const userRef = doc(db, 'users', currentUser.uid);
        const unsubscribe = onSnapshot(userRef, (userSnap) => {
            if (userSnap.exists()) {
                const userData = userSnap.data();
                if (userData && userData.familyCode) {
                    setUserFamilyCode(userData.familyCode);

                    // Auto-sync latest health/finance data to the family doc on any local change
                    if (userData.finance) {
                        syncUserStatsToFamily(userData.familyCode, currentUser.uid, 'finance', userData.finance);
                    }
                    if (userData.health) {
                        syncUserStatsToFamily(userData.familyCode, currentUser.uid, 'health', userData.health);
                    }
                } else {
                    setUserFamilyCode(null);
                }
            } else {
                setUserFamilyCode(null);
            }
        }, (error) => {
            console.error("User document sync listener error:", error);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Hook 2: Listen to Family Document for Real-Time Member Sync
    useEffect(() => {
        if (currentUser) {
            if (!userFamilyCode) {
                Promise.resolve().then(() => setFamilyState({
                    subscription: { status: 'free', tier: 'free' },
                    role: null,
                    familyCode: '',
                    members: [],
                    challenges: []
                }));
                return;
            }

            const familyRef = doc(db, 'families', userFamilyCode);
            const unsubscribe = onSnapshot(familyRef, (famSnap) => {
                if (famSnap.exists()) {
                    const famData = famSnap.data();
                    setFamilyState({
                        name: famData.name || "Family Hub",
                        subscription: { status: 'premium', tier: famData.tier },
                        role: famData.adminId === currentUser.uid ? 'admin' : 'member',
                        familyCode: userFamilyCode,
                        members: famData.members || [],
                        challenges: famData.challenges || [],
                        notifications: famData.notifications || [],
                        contacts: famData.contacts || [],
                        rules: famData.rules || []
                    });
                }
            }, (error) => {
                console.error("Family document sync listener error:", error);
            });

            return () => unsubscribe();
        } else {
            // LOCAL FALLBACK MODE
            const rehydrate = () => {
                const session = getSession();
                const db = getDB();
                if (session.familyCode && db[session.familyCode]) {
                    const family = db[session.familyCode];
                    setFamilyState({
                        name: family.name || "Family Hub",
                        subscription: { status: 'premium', tier: family.tier },
                        role: session.role,
                        familyCode: session.familyCode,
                        members: family.members || [],
                        challenges: family.challenges || [],
                        contacts: family.contacts || [],
                        rules: family.rules || []
                    });
                } else {
                    setFamilyState({ subscription: { status: 'free', tier: 'free' }, role: null, familyCode: '', members: [], challenges: [], contacts: [], rules: [] });
                }
            };
            rehydrate();
            const handleStorageChange = () => rehydrate();
            window.addEventListener('storage', handleStorageChange);
            return () => window.removeEventListener('storage', handleStorageChange);
        }
    }, [currentUser, userFamilyCode]);


    // --- ACTIONS ---

    const generateFamilyCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) { code += chars.charAt(Math.floor(Math.random() * chars.length)); }
        return code;
    };

    const upgradeToFamily = async (tier = 'Standard Family', familyName = 'My Family Hub', creatorName = 'Family Admin') => {
        const newCode = generateFamilyCode();

        if (currentUser) {
            // Cloud Implementation
            const newFamily = {
                code: newCode,
                tier: tier,
                name: familyName,
                adminId: currentUser.uid,
                members: [
                    {
                        id: currentUser.uid,
                        name: creatorName || currentUser.phoneNumber || 'Family Admin',
                        role: 'Admin',
                        profile: null,
                        permissions: { health: true, finance: true },
                        isSelf: true // UI helper
                    }
                ]
            };

            try {
                // Create Family Doc
                await withTimeout(setDoc(doc(db, 'families', newCode), newFamily), 5000, "Database write timeout. The Firebase project may have exceeded its daily free quota.");
                // Update User Doc
                await withTimeout(setDoc(doc(db, 'users', currentUser.uid), { familyCode: newCode }, { merge: true }), 5000, "Database write timeout. The Firebase project may have exceeded its daily free quota.");
                return { success: true };
            } catch (e) {
                console.error("Upgrade failed:", e);
                return { success: false, message: e.message };
            }
        } else {
            // Local fallback
            const db = getDB();
            const newFamily = {
                code: newCode,
                tier: tier,
                name: familyName,
                members: [{ id: 'admin', name: creatorName || 'Family Admin', role: 'Admin', profile: null, permissions: { health: true, finance: true }, isSelf: true }]
            };
            db[newCode] = newFamily;
            saveDB(db);
            saveSession({ familyCode: newCode, role: 'admin', myId: 'admin' });
            return { success: true };
        }
    };

    const joinFamily = async (code, name = 'Member', role = 'Member') => {
        if (currentUser) {
            // Cloud Implementation
            const familyRef = doc(db, 'families', code);
            const familySnap = await getDoc(familyRef);

            if (!familySnap.exists()) return { success: false, message: "Invalid family code." };

            const famData = familySnap.data();
            const members = famData.members || [];
            
            // Prevent duplicate entries
            if (members.find(m => m.id === currentUser.uid)) {
                await setDoc(doc(db, 'users', currentUser.uid), { familyCode: code }, { merge: true });
                return { success: true, message: "Already a member! Synced." };
            }

            const newMember = {
                id: currentUser.uid,
                name: name || currentUser.displayName || currentUser.email || 'Family Member',
                role: role,
                profile: null,
                finance: { netWorth: 0, spending: 0, budget: 0 },
                health: { steps: 0, sleep: '--' },
                permissions: { health: true, finance: true }
            };

            try {
                // 1. Atomically add member to the family members array
                await withTimeout(updateDoc(familyRef, {
                    members: arrayUnion(newMember)
                }), 5000, "Database write timeout. The Firebase project may have exceeded its daily free quota.");

                // 2. Link user's account to this family
                await withTimeout(setDoc(doc(db, 'users', currentUser.uid), { familyCode: code }, { merge: true }), 5000, "Database write timeout. The Firebase project may have exceeded its daily free quota.");

                // 3. Write join notification — NON-CRITICAL, isolated from join success
                try {
                    const joinNotification = {
                        id: 'notif_' + Date.now(),
                        type: 'member_joined',
                        memberName: newMember.name,
                        memberRole: role,
                        timestamp: new Date().toISOString(),
                        read: false
                    };
                    await updateDoc(familyRef, {
                        notifications: arrayUnion(joinNotification)
                    });
                } catch (notifErr) {
                    // Notification failure must NEVER block the join from succeeding
                    console.warn('[Family Join] Notification write failed (non-critical):', notifErr.message);
                }

                return { success: true, message: "Joined Family!" };
            } catch (e) {
                return { success: false, message: "Join failed: " + e.message };
            }

        } else {
            // Local Fallback
            const db = getDB();
            const family = db[code];
            if (!family) return { success: false, message: "Invalid family code." };
            const memberId = 'mem_' + Math.floor(Math.random() * 10000);
            const newMember = {
                id: memberId, name: name, role: role, profile: null,
                finance: { netWorth: 0, spending: 0, budget: 0 },
                health: { steps: 0, sleep: '--' }, // Init empty
                permissions: { health: true, finance: true }
            };
            family.members.push(newMember);
            db[code] = family;
            saveDB(db);
            saveSession({ familyCode: code, role: 'member', myId: memberId });
            return { success: true, message: `Joined ${family.tier}!` };
        }
    };

    const toggleSharing = async (type) => {
        // Toggle logic is complex with arrays in Firestore (need to read, modify, write back)
        // For simplicity in this demo, we'll assume we can replace the member object
        if (currentUser && familyState.familyCode) {
            const familyRef = doc(db, 'families', familyState.familyCode);
            // We need to read current state to find index
            // Since we have familyState.members handy:
            const updatedMembers = familyState.members.map(m => {
                if (m.id === currentUser.uid) {
                    const newPerms = { ...m.permissions, [type]: !m.permissions?.[type] };
                    return { ...m, permissions: newPerms };
                }
                return m;
            });

            await updateDoc(familyRef, { members: updatedMembers });
        }
        else {
            // Local fallback... (use existing logic)
            const session = getSession();
            if (!session.familyCode || !session.myId) return;
            const db = getDB();
            const family = db[session.familyCode];
            if (!family) return;
            const memberIndex = family.members.findIndex(m => m.id === session.myId);
            if (memberIndex === -1) return;
            const member = family.members[memberIndex];
            if (!member.permissions) member.permissions = { health: true, finance: true };
            member.permissions[type] = !member.permissions[type];
            family.members[memberIndex] = member;
            db[session.familyCode] = family;
            saveDB(db);
        }
    };

    const leaveFamily = async () => {
        if (currentUser && familyState.familyCode) {
            const familyCode = familyState.familyCode;
            // 1. Remove from family members array
            const familyRef = doc(db, 'families', familyCode);
            const updatedMembers = familyState.members.filter(m => m.id !== currentUser.uid);
            await updateDoc(familyRef, { members: updatedMembers });

            // 2. Unlink user
            await updateDoc(doc(db, 'users', currentUser.uid), { familyCode: '' }); // Or delete field

        } else {
            // Local fallback
            const session = getSession();
            if (session.familyCode && session.myId) {
                const db = getDB();
                const family = db[session.familyCode];
                if (family) {
                    family.members = family.members.filter(m => m.id !== session.myId);
                    if (family.members.length === 0) delete db[session.familyCode];
                    else db[session.familyCode] = family;
                    saveDB(db);
                }
            }
            localStorage.removeItem(SESSION_KEY);
        }
    };

    const updateFamilyMemberStats = async (type, data) => {
        if (currentUser) {
            if (!familyState.familyCode) return;
            // 1. Optimistic UI update - instantly update state in memory for real-time reactivity
            setFamilyState(prev => {
                const updatedMembers = (prev.members || []).map(m => {
                    if (m.id === currentUser.uid) {
                        return { ...m, [type]: { ...(m[type] || {}), ...data } };
                    }
                    return m;
                });
                return { ...prev, members: updatedMembers };
            });

            // 2. Background persistence to Firestore
            await syncUserStatsToFamily(familyState.familyCode, currentUser.uid, type, data);
        } else {
            // Local / Mock Fallboard updates - keep simulation completely synchronized
            const session = getSession();
            if (!session.familyCode || !session.myId) return;
            
            const db = getDB();
            const family = db[session.familyCode];
            if (!family) return;

            const memberIndex = family.members.findIndex(m => m.id === session.myId);
            if (memberIndex === -1) return;

            const member = family.members[memberIndex];
            member[type] = { ...(member[type] || {}), ...data };
            family.members[memberIndex] = member;
            
            db[session.familyCode] = family;
            saveDB(db);

            setFamilyState(prev => {
                const updatedMembers = (prev.members || []).map(m => {
                    if (m.id === session.myId) {
                        return { ...m, [type]: { ...(m[type] || {}), ...data } };
                    }
                    return m;
                });
                return { ...prev, members: updatedMembers };
            });
        }
    };

    const currentUserId = currentUser ? currentUser.uid : (getSession().myId || 'admin');

    const displayMembers = (familyState.members || []).map(m => {
        if (m.id === currentUserId) {
            return {
                ...m,
                health: {
                    ...m.health,
                    steps: healthState?.steps !== undefined && healthState.steps !== null ? healthState.steps : m.health?.steps,
                    heartRate: healthState?.heartRate !== undefined && healthState.heartRate !== null ? healthState.heartRate : m.health?.heartRate,
                    sleep: healthState?.sleep !== undefined && healthState.sleep !== null ? healthState.sleep : m.health?.sleep
                }
            };
        }
        return m;
    });

    // --- AGGREGATION HELPERS ---
    const getHouseholdStats = () => {
        if (!displayMembers || displayMembers.length === 0) return null;

        return displayMembers.reduce((acc, m) => {
            // Only count if permission is granted AND data exists
            if (m.permissions?.finance !== false && m.finance) {
                acc.netWorth += m.finance.netWorth || 0;
                acc.spending += m.finance.spending || 0;
            }
            // Logic for Steps Aggregation
            if (m.permissions?.health !== false) {
                acc.steps += m.health?.steps || 0;
            }
            return acc;
        }, { netWorth: 0, spending: 0, steps: 0 });
    };

    const getLeaderboard = (type) => {
        if (!displayMembers) return [];

        return displayMembers
            .filter(m => m.permissions?.[type] !== false) // Private members hidden from leaderboard
            .map(m => {
                let score = 0;
                // Normalize data access for Admin vs Members
                if (type === 'health') {
                    score = m.health?.steps || 0;
                }
                if (type === 'finance') {
                    // Savings = Budget - Spending
                    const budget = m.finance?.budget || 0;
                    const spending = m.finance?.spending || 0;
                    score = Math.max(0, budget - spending);
                }
                const isSelf = m.id === currentUserId;
                return { name: m.name, score: Math.round(score), id: m.id, isSelf };
            })
            .sort((a, b) => b.score - a.score); // Descending
    };

    const createChallenge = async (title, type, target) => {
        const targetCode = userFamilyCode || familyState.familyCode;
        if (!targetCode) return { success: false, message: "No family hub connected." };
        
        try {
            const familyRef = doc(db, 'families', targetCode);
            const newChallenge = {
                id: 'ch_' + Date.now(),
                title,
                type,
                target: parseFloat(target),
                creatorId: currentUser ? currentUser.uid : 'admin',
                participants: [currentUser ? currentUser.uid : 'admin'], // Creator joins automatically
                createdAt: new Date().toISOString()
            };
            
            // In Cloud mode
            if (currentUser) {
                const famSnap = await getDoc(familyRef);
                if (famSnap.exists()) {
                    const famData = famSnap.data();
                    const existingChallenges = famData.challenges || [];
                    await updateDoc(familyRef, {
                        challenges: [...existingChallenges, newChallenge]
                    });
                    return { success: true };
                }
            } else {
                // Local Fallback mode
                const localDB = getDB();
                if (localDB[targetCode]) {
                    const family = localDB[targetCode];
                    family.challenges = [...(family.challenges || []), newChallenge];
                    localDB[targetCode] = family;
                    saveDB(localDB);
                    return { success: true };
                }
            }
        } catch (e) {
            console.error("Challenge creation failed:", e);
            return { success: false, message: e.message };
        }
    };

    const joinChallenge = async (challengeId) => {
        const targetCode = userFamilyCode || familyState.familyCode;
        if (!targetCode) return { success: false, message: "No family hub connected." };
        
        try {
            const familyRef = doc(db, 'families', targetCode);
            if (currentUser) {
                const famSnap = await getDoc(familyRef);
                if (famSnap.exists()) {
                    const famData = famSnap.data();
                    const existingChallenges = famData.challenges || [];
                    const updatedChallenges = existingChallenges.map(ch => {
                        if (ch.id === challengeId) {
                            // Avoid duplicates
                            const participants = ch.participants || [];
                            if (!participants.includes(currentUser.uid)) {
                                return { ...ch, participants: [...participants, currentUser.uid] };
                            }
                        }
                        return ch;
                    });
                    await updateDoc(familyRef, { challenges: updatedChallenges });
                    return { success: true };
                }
            } else {
                // Local Fallback mode
                const localDB = getDB();
                if (localDB[targetCode]) {
                    const family = localDB[targetCode];
                    const challenges = family.challenges || [];
                    family.challenges = challenges.map(ch => {
                        if (ch.id === challengeId) {
                            const participants = ch.participants || [];
                            const session = getSession();
                            const currentRole = session.role || 'Member';
                            if (!participants.includes(currentRole)) {
                                return { ...ch, participants: [...participants, currentRole] };
                            }
                        }
                        return ch;
                    });
                    localDB[targetCode] = family;
                    saveDB(localDB);
                    return { success: true };
                }
            }
        } catch (e) {
            console.error("Challenge join failed:", e);
            return { success: false, message: e.message };
        }
    };

    // Mark all notifications as read (admin dismisses alert banner)
    const markNotificationsRead = async () => {
        if (!currentUser || !userFamilyCode) return;
        try {
            const familyRef = doc(db, 'families', userFamilyCode);
            const famSnap = await getDoc(familyRef);
            if (famSnap.exists()) {
                const famData = famSnap.data();
                const updatedNotifs = (famData.notifications || []).map(n => ({ ...n, read: true }));
                await updateDoc(familyRef, { notifications: updatedNotifs });
            }
        } catch (e) {
            console.error("Failed to mark notifications read:", e);
        }
    };

    // Admin actions
    const removeMember = async (memberId) => {
        if (!currentUser || !familyState.familyCode) return;
        try {
            const familyRef = doc(db, 'families', familyState.familyCode);
            const updatedMembers = familyState.members.filter(m => m.id !== memberId);
            await updateDoc(familyRef, { members: updatedMembers });
            await updateDoc(doc(db, 'users', memberId), { familyCode: '' });
        } catch (e) {
            console.error("Failed to remove member:", e);
        }
    };

    const updateMemberRole = async (memberId, newRole) => {
        if (!currentUser || !familyState.familyCode) return;
        try {
            const familyRef = doc(db, 'families', familyState.familyCode);
            const updatedMembers = familyState.members.map(m => m.id === memberId ? { ...m, role: newRole } : m);
            await updateDoc(familyRef, { members: updatedMembers });
        } catch (e) {
            console.error("Failed to update role:", e);
        }
    };

    const updateFamilyRules = async (newRules) => {
        if (!currentUser || !familyState.familyCode) return;
        try {
            const familyRef = doc(db, 'families', familyState.familyCode);
            await updateDoc(familyRef, { rules: newRules });
        } catch (e) {
            console.error("Failed to update rules:", e);
        }
    };

    return (
        <FamilyContext.Provider value={{ 
            familyState: { ...familyState, members: displayMembers }, 
            upgradeToFamily, joinFamily, leaveFamily, 
            toggleSharing, getHouseholdStats, getLeaderboard, 
            updateFamilyMemberStats, createChallenge, joinChallenge,
            markNotificationsRead, removeMember, updateMemberRole, updateFamilyRules,
            myId: currentUserId
        }}>
            {children}
        </FamilyContext.Provider>
    );
};

export default FamilyProvider;
