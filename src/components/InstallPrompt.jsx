import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

/**
 * InstallPrompt.jsx
 * 
 * Shows a native-feeling "Add to Home Screen" banner when the app
 * is being used in a browser but is installable as a PWA.
 * 
 * On Android Chrome: Uses the `beforeinstallprompt` event.
 * On iOS Safari: Shows manual instructions (iOS doesn't support auto-install).
 */

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Don't show if already installed as PWA
        if (window.matchMedia('(display-mode: standalone)').matches) return;
        if (window.navigator.standalone === true) return; // iOS standalone

        // Don't show if user dismissed it before (respect for 7 days)
        const dismissed = localStorage.getItem('pwa_install_dismissed');
        if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

        // Detect iOS
        const ua = navigator.userAgent;
        const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        setIsIOS(isiOS);

        if (isiOS) {
            // Show manual install instructions after 3 seconds
            const timer = setTimeout(() => setShowBanner(true), 3000);
            return () => clearTimeout(timer);
        }

        // Android / Desktop: Listen for the install prompt event
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setTimeout(() => setShowBanner(true), 2000);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            if (result.outcome === 'accepted') {
                setShowBanner(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('pwa_install_dismissed', Date.now().toString());
    };

    if (!showBanner) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 80, // Above the bottom nav bar
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)',
            maxWidth: 400,
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 16,
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            zIndex: 9999,
            boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(99, 102, 241, 0.1)',
            animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateX(-50%) translateY(100px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            `}</style>

            <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
            }}>
                <Smartphone size={22} color="white" />
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 2 }}>
                    Install UNIFY App
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>
                    {isIOS 
                        ? 'Tap the Share button ⬆ then "Add to Home Screen"' 
                        : 'Add to your home screen for the full app experience'}
                </div>
            </div>

            {!isIOS && (
                <button
                    onClick={handleInstall}
                    style={{
                        padding: '8px 14px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        border: 'none', borderRadius: 10,
                        color: 'white', fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
                    }}
                >
                    Install
                </button>
            )}

            <button
                onClick={handleDismiss}
                style={{
                    background: 'none', border: 'none',
                    color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                    padding: 4, flexShrink: 0
                }}
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default InstallPrompt;
