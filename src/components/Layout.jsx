import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Heart, Wallet, Users, LayoutDashboard, Settings, ShieldAlert, Cloud } from 'lucide-react';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/' },
        { icon: Heart, label: 'Health', path: '/health' },
        { icon: Wallet, label: 'Finance', path: '/finance' },
        { icon: Users, label: 'Family Hub', path: '/family' },
        { icon: Cloud, label: 'Community', path: '/community' },
        { icon: ShieldAlert, label: 'Admin Control', path: '/admin' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className={styles.container}>
            {/* Sidebar - Desktop */}
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    <img src="/logo.png" alt="UNIFY" style={{ width: 32, height: 32, marginRight: 8 }} />
                    UNIFY
                </div>
                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `${styles.navItem} ${isActive ? styles.active : ''}`
                            }
                        >
                            <item.icon size={20} />
                            <span className={styles.navLabel}>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Mobile Header */}
            <header className={styles.mobileHeader}>
                <div className={styles.logo}>
                    <img src="/logo.png" alt="UNIFY" style={{ width: 28, height: 28, marginRight: 8 }} />
                    UNIFY
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.main}>
                <div className={styles.content}>
                    {children}
                </div>
            </main>

            {/* Bottom Nav - Mobile */}
            <nav className={styles.bottomNav}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `${styles.bottomNavItem} ${isActive ? styles.active : ''}`
                        }
                    >
                        <item.icon size={20} />
                        <span className={styles.bottomNavLabel}>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default Layout;
