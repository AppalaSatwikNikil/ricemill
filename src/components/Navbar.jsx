import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const { cartItems } = useCart();
    const { currentUser, userRole, logout } = useAuth();
    const cartCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        console.log("Navbar: Initiating logout...");
        try {
            // We call logout but don't strictly await it before starting navigation
            // to ensure the UI feels responsive.
            logout();
            console.log("Navbar: Logout called, navigating to login...");
            navigate('/login', { replace: true });
        } catch (error) {
            console.error("Logout navigation failed:", error);
            window.location.href = '/login';
        }
    };

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            {/* ... logo ... */}
            <div className="container navbar-content">
                <Link to="/" className="logo">
                    <div className="logo-icon">S</div>
                    <div className="logo-text">
                        <span className="brand-name">Santi Rice Mill</span>
                        <span className="brand-tagline">Premium Quality Rice</span>
                    </div>
                </Link>

                <ul className="nav-links">
                    <li><Link to="/">Home</Link></li>
                    <li><a href="/#products">Products</a></li>
                    <li><a href="/#about">About</a></li>
                    {userRole === 'admin' && (
                        <li><Link to="/admin" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Dashboard</Link></li>
                    )}
                    <li><a href="/#contact">Contact</a></li>
                </ul>

                <div className="nav-actions">
                    {!currentUser ? (
                        <>
                            <Link to="/login" className="login-link">
                                Login
                            </Link>
                            <Link to="/register" className="signup-btn">
                                Sign Up
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/cart" className="cart-btn" aria-label="Cart">
                                <div className="cart-icon-wrapper">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                                    {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                                </div>
                            </Link>
                            <div className="nav-user">
                                <span className="user-email">{currentUser?.email}</span>
                                <button onClick={handleLogout} className="signout-btn">
                                    Sign Out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
