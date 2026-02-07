import React from 'react';
import { useAuth } from '../context/AuthContext';
import Hero from './Hero';
import Features from './Features';
import Products from './Products';
import About from './About';
import Contact from './Contact';
import { Link } from 'react-router-dom';

const Home = () => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return (
            <div className="landing-page">
                <Hero />
                <div className="landing-cta" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--color-bg-light)' }}>
                    <h2>Join Santi Rice Mill Today</h2>
                    <p style={{ maxWidth: '600px', margin: '1rem auto 2rem', color: 'var(--color-text-body)' }}>
                        Sign up to explore our premium collection of rice products, manage your orders, and enjoy seamless delivery.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/login" className="btn btn-primary">Login to Shop</Link>
                        <Link to="/register" className="btn btn-outline">Create Account</Link>
                    </div>
                </div>
                {/* Maybe show minimal features or about, but hide detailed products */}
                <Features />
                <About />
                <Contact />
            </div>
        );
    }

    return (
        <>
            <Hero />
            <Features />
            <Products />
            <About />
            <Contact />
        </>
    );
};

export default Home;
