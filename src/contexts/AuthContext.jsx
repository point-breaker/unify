
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
    onAuthStateChanged,
    signInWithPhoneNumber,
    signInAnonymously,
    updateProfile,
    RecaptchaVerifier,
    signOut
} from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real Firebase Auth listener — handles phone, anonymous, and all sessions
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const setupRecaptcha = (elementId) => {
        const container = document.getElementById(elementId);
        if (!container) return null;

        // Clear any old widgets inside the DOM container to enable fresh renders
        container.innerHTML = '';

        return new RecaptchaVerifier(auth, container, {
            'size': 'invisible',
            'callback': (response) => {
                // reCAPTCHA solved
            }
        });
    };

    const loginWithPhone = async (phoneNumber, appVerifier) => {
        return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    };

    /**
     * signInSimulated — now uses REAL Firebase Anonymous Auth.
     * This gives a genuine Firebase Auth token so Firestore security
     * rules (request.auth != null) pass correctly.
     * The display name is set from the provided phone number for identification.
     */
    const signInSimulated = async (phoneNumber) => {
        try {
            const credential = await signInAnonymously(auth);
            // Set a display name so family members show a readable name
            await updateProfile(credential.user, {
                displayName: phoneNumber || 'Demo User'
            });
            // currentUser is updated automatically by onAuthStateChanged
            return { success: true };
        } catch (e) {
            console.error('[Auth] Anonymous sign-in failed:', e);
            return { success: false, message: e.message };
        }
    };

    const logout = async () => {
        return signOut(auth);
    };

    const value = {
        currentUser,
        setupRecaptcha,
        loginWithPhone,
        signInSimulated,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
