import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Hero.css';

const Hero = () => {
    const { currentUser } = useAuth();
    const userName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'valued customer';

    return (
        <section id="home" className="hero">
            <div className="container hero-container">
                <div className="trust-badge">
                    <span className="badge-icon">🏆</span>
                    Trusted by 10,000+ Families
                </div>

                <h1 className="hero-title">
                    {currentUser ? `Welcome back, ${userName}!` : 'Premium Quality Rice'} <br />
                    <span className="highlight-text">Direct from Our Mill</span>
                </h1>

                <p className="hero-subtitle">
                    {currentUser
                        ? "We're glad to see you again! Explore our latest harvest of pure, nutritious, and delicious rice specially selected for your family."
                        : "Experience the authentic taste of freshly milled rice. From our fields to your table, we deliver pure, nutritious, and delicious rice for your family."
                    }
                </p>

                <div className="hero-actions">
                    <a href="#products" className="btn btn-primary">
                        Shop Now
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </a>
                    <a href="#about" className="btn btn-outline">
                        Learn More
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01" /></svg>
                    </a>
                </div>
                {/* ... indicator and bg ... */}

                <div className="scroll-indicator">
                    <p>Scroll to explore</p>
                    <svg className="bounce" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13l5 5 5-5M7 6l5 5 5-5" /></svg>
                </div>
            </div>

            {/* Background decoration */}
            <div className="hero-bg-pattern"></div>
        </section>
    );
};

export default Hero;
