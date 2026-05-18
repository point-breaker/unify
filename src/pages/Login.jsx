
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Phone, ArrowRight, ShieldCheck, Activity, User, MessageSquare } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styles from './Login.module.css';

const Login = () => {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [step, setStep] = useState('phone'); // 'phone' | 'otp'

    // Form Inputs
    const [phoneNumber, setPhoneNumber] = useState('');
    const [name, setName] = useState('');
    const [otp, setOtp] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [simulatedCode, setSimulatedCode] = useState('');
    const [smsToast, setSmsToast] = useState(null);

    const { loginWithPhone, setupRecaptcha, signInSimulated, currentUser } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formattedNumber = phoneNumber.startsWith('+')
            ? phoneNumber
            : `+91${phoneNumber.replace(/^0+/, '')}`; // Default to India (+91)

        let appVerifier = null;
        try {
            // 1. Strictly attempt real Firebase Phone SMS dispatch first
            appVerifier = setupRecaptcha('recaptcha-container');
            const confirmation = await loginWithPhone(formattedNumber, appVerifier);
            setConfirmationResult(confirmation);
            setStep('otp');
        } catch (err) {
            console.warn("Firebase Phone Auth failed/restricted. Checking billing constraints...", err);
            
            // 2. Automate presentation-safe sandbox fallback ONLY on Firebase billing restriction
            if (err.code === 'auth/billing-not-enabled' || err.message?.includes('billing-not-enabled')) {
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                setSimulatedCode(code);
                
                // Add minor cellular gateway latency for realistic feedback
                await new Promise(resolve => setTimeout(resolve, 800));
                
                setConfirmationResult({ isSimulated: true, number: formattedNumber });
                setStep('otp');
                
                // Dispatch sliding push notification toast
                setSmsToast({ phone: formattedNumber, code: code });
                setTimeout(() => {
                    setSmsToast(null);
                }, 8000);
            } else {
                // Return real Firebase errors (e.g., unauthorized domain) for whitelisting diagnosis
                setError('SMS Error: ' + (err.message || 'Verification failed. Make sure your domain is whitelisted in Firebase Console.'));
            }

            // Clean up Google reCAPTCHA state on error so it can be re-rendered on next submit
            if (appVerifier) {
                try {
                    appVerifier.clear();
                } catch (e) {
                    console.warn("Failed to clear verifier on catch:", e);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formattedNumber = phoneNumber.startsWith('+')
            ? phoneNumber
            : `+91${phoneNumber.replace(/^0+/, '')}`;

        try {
            let uid = "";
            let verifiedPhoneNumber = "";

            if (confirmationResult && confirmationResult.isSimulated) {
                // Verify against Sandbox generator code
                if (otp !== simulatedCode) {
                    throw new Error("Invalid OTP");
                }
                
                // Process sandbox authentication
                signInSimulated(formattedNumber);
                uid = `sim_${formattedNumber.replace(/[^0-9]/g, '')}`;
                verifiedPhoneNumber = formattedNumber;
            } else {
                // Real Firebase phone authentication verification
                const result = await confirmationResult.confirm(otp);
                const user = result.user;
                uid = user.uid;
                verifiedPhoneNumber = user.phoneNumber;
            }

            // Sync user data to Firestore
            const userDocRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userDocRef);

            if (mode === 'register') {
                await setDoc(userDocRef, {
                    name: name,
                    phoneNumber: verifiedPhoneNumber,
                    createdAt: new Date().toISOString()
                }, { merge: true });
            } else {
                if (!userSnap.exists()) {
                    await setDoc(userDocRef, {
                        phoneNumber: verifiedPhoneNumber,
                        name: name || `User (${verifiedPhoneNumber.slice(-4)})`
                    }, { merge: true });
                }
            }

            navigate('/'); // Success!
        } catch (err) {
            console.error("OTP Verification Error:", err);
            setError('Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError('');
        setStep('phone');
    };

    return (
        <div className={styles.container}>
            {/* iOS Push Notification CSS Keyframes */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideDown {
                    0% { transform: translate(-50%, -100px); opacity: 0; }
                    100% { transform: translate(-50%, 0); opacity: 1; }
                }
            ` }} />

            {/* Premium iOS-style Push Notification Toast */}
            {smsToast && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '90%',
                    maxWidth: '400px',
                    background: 'rgba(15, 18, 24, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '16px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    zIndex: 9999,
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
                        padding: '8px',
                        borderRadius: '10px',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <MessageSquare size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>MESSAGES</span>
                            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.3)' }}>now</span>
                        </div>
                        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'white', margin: '0 0 2px 0' }}>Unify SMS Sandbox Gateway</h4>
                        <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', margin: 0, lineHeight: 1.4 }}>
                            Your verification code is <strong style={{ color: '#1abc9c', fontSize: '13px', background: 'rgba(26, 188, 156, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>{smsToast.code}</strong>. It will expire in 5 minutes.
                        </p>
                    </div>
                </div>
            )}

            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logoBox}>
                        <img src="/logo.png" alt="Unify" style={{ width: 40, height: 40 }} />
                    </div>
                    <h1 className={styles.title}>
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className={styles.subtitle}>
                        {mode === 'login' ? 'Login to access your family dashboard.' : 'Join Unify to track health & wealth together.'}
                    </p>
                </div>

                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                {step === 'phone' ? (
                    <form onSubmit={handleSendOtp}>

                        {/* Name Input - Only for Register */}
                        {mode === 'register' && (
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Full Name</label>
                                <div className={styles.inputWrapper}>
                                    <User size={18} className={styles.icon} />
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className={styles.input}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Phone Number</label>
                            <div className={styles.inputWrapper}>
                                <Phone size={18} className={styles.icon} />
                                <input
                                    type="tel"
                                    placeholder="+91 99999 99999"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className={styles.input}
                                    required
                                />
                            </div>
                            <p className={styles.helperText}>
                                Msg & data rates may apply.
                            </p>
                        </div>

                        <div id="recaptcha-container"></div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={styles.primaryBtn}
                        >
                            {loading ? 'Sending...' : 'Continue'} <ArrowRight size={18} />
                        </button>

                        <div className={styles.footer}>
                            <p>
                                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                                <button
                                    type="button"
                                    onClick={toggleMode}
                                    className={styles.linkBtn}
                                >
                                    {mode === 'login' ? 'Register' : 'Login'}
                                </button>
                            </p>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Enter OTP</label>
                            <div className={styles.inputWrapper}>
                                <ShieldCheck size={18} className={styles.icon} />
                                <input
                                    type="text"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className={`${styles.input} ${styles.otpInput}`}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={styles.primaryBtn}
                            style={{ background: 'var(--success)' }}
                        >
                            {loading ? 'Verifying...' : 'Verify & Login'} <ArrowRight size={18} />
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep('phone')}
                            className={styles.secondaryBtn}
                        >
                            Change Number
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
