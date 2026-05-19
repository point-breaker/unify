
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, ArrowRight, ShieldCheck, Activity, User, MessageSquare } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styles from './Login.module.css';

const Login = () => {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [step, setStep] = useState('email'); // 'email' | 'otp'

    // Form Inputs
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [otp, setOtp] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMockSession, setIsMockSession] = useState(false);
    const [simulatedCode, setSimulatedCode] = useState('');
    const [emailToast, setEmailToast] = useState(null);

    const { sendOtpEmail, verifyOtpEmail, signInSimulated, currentUser } = useAuth();
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

        const normalizedEmail = email.toLowerCase().trim();

        try {
            const result = await sendOtpEmail(normalizedEmail);
            if (!result.success) {
                throw new Error(result.message || 'Failed to dispatch verification code.');
            }

            if (result.mock) {
                // SMTP Not configured yet – display custom sandboxed mock banner
                setIsMockSession(true);
                setSimulatedCode(result.otp);
                
                // Only show mock notification banner if no real email was dispatched!
                if (!result.emailSent) {
                    setEmailToast({ email: normalizedEmail, code: result.otp });
                    setTimeout(() => {
                        setEmailToast(null);
                    }, 10000);
                }
            } else {
                setIsMockSession(false);
            }

            setStep('otp');
        } catch (err) {
            console.error("Gmail OTP dispatch error:", err);
            setError(err.message || 'Unable to connect to authentication server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const normalizedEmail = email.toLowerCase().trim();

        try {
            let uid = "";
            if (isMockSession) {
                if (otp.trim() !== simulatedCode.trim()) {
                    throw new Error("Invalid verification code.");
                }
                const simResult = await signInSimulated(normalizedEmail);
                if (!simResult.success) {
                    throw new Error(simResult.message || 'Simulated login failed.');
                }
                const { auth } = await import('../firebase');
                uid = auth.currentUser.uid;
            } else {
                const result = await verifyOtpEmail(normalizedEmail, otp);
                if (!result.success) {
                    throw new Error(result.message || 'Invalid code.');
                }
                const { auth } = await import('../firebase');
                uid = auth.currentUser.uid;
            }

            // Sync user data to Firestore
            const userDocRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userDocRef);

            if (mode === 'register') {
                await setDoc(userDocRef, {
                    name: name,
                    email: normalizedEmail,
                    createdAt: new Date().toISOString()
                }, { merge: true });
            } else {
                if (!userSnap.exists()) {
                    await setDoc(userDocRef, {
                        email: normalizedEmail,
                        name: name || normalizedEmail.split('@')[0]
                    }, { merge: true });
                }
            }

            navigate('/'); // Success!
        } catch (err) {
            console.error("Gmail OTP Verification Error:", err);
            setError(err.message || 'Invalid verification code. Please check and try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError('');
        setStep('email');
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

            {/* Premium iOS-style Push Notification Toast for Local Fallback OTP */}
            {emailToast && (
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
                            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>GMAIL GATEWAY</span>
                            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.3)' }}>now</span>
                        </div>
                        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'white', margin: '0 0 2px 0' }}>Unify Local Sandbox OTP</h4>
                        <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', margin: 0, lineHeight: 1.4 }}>
                            Your verification code is <strong style={{ color: '#1abc9c', fontSize: '13px', background: 'rgba(26, 188, 156, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>{emailToast.code}</strong>. Use this to bypass real SMTP setup.
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
                        {mode === 'login' ? 'Login with Gmail to access your hub.' : 'Join Unify to track health & wealth together.'}
                    </p>
                </div>

                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                {step === 'email' ? (
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
                            <label className={styles.label}>Gmail / Email Address</label>
                            <div className={styles.inputWrapper}>
                                <Mail size={18} className={styles.icon} />
                                <input
                                    type="email"
                                    placeholder="yourname@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={styles.input}
                                    required
                                />
                            </div>
                            <p className={styles.helperText}>
                                A secure 6-digit verification code will be sent to your inbox.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={styles.primaryBtn}
                        >
                            {loading ? 'Sending Code...' : 'Send Verification Code'} <ArrowRight size={18} />
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
                            <label className={styles.label}>Enter Code</label>
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
                            onClick={() => setStep('email')}
                            className={styles.secondaryBtn}
                        >
                            Change Email
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
