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

    return (
        <div className="home-page">
            <Hero />

            <Features />
            <Products />
            <About />
            <Contact />
        </div>
    );
};

export default Home;
