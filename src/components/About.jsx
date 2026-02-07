import React from 'react';
import './About.css';
// import aboutImage from '../assets/about-image.jpg'; // Placeholder for now

const About = () => {
    return (
        <section id="about" className="about-section section-padding">
            <div className="container">
                <div className="about-grid">
                    <div className="about-image-wrapper">
                        {/* Using a placeholder for now, will replace with generated image */}
                        <div className="about-image-placeholder">
                            <img src="/assets/about-image.png" alt="Rice Fields" className="about-img" />
                        </div>
                        <div className="years-badge">
                            <span className="years-num">25+</span>
                            <span className="years-text">Years of Excellence</span>
                        </div>
                    </div>

                    <div className="about-content">
                        <div className="section-tag">About Us</div>
                        <h2 className="section-title">
                            Traditional Values, <br />Modern Quality
                        </h2>
                        <p className="about-text">
                            Santi Rice Mill has been serving families with premium quality rice for over 25 years. Our commitment to quality begins at the field and continues through every step of processing, ensuring that only the finest grains reach your table.
                        </p>
                        <p className="about-text">
                            We work directly with farmers, supporting sustainable agricultural practices while delivering the freshest, most nutritious rice to our customers. Every grain tells a story of dedication, tradition, and uncompromising quality.
                        </p>

                        <div className="stats-grid">
                            <div className="stat-item">
                                <div className="stat-icon">🏷️</div>
                                <div className="stat-value">25+</div>
                                <div className="stat-label">Years</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-icon">👥</div>
                                <div className="stat-value">10K+</div>
                                <div className="stat-label">Happy Customers</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-icon">🚚</div>
                                <div className="stat-value">50K+</div>
                                <div className="stat-label">Orders</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-icon">🛡️</div>
                                <div className="stat-value">100%</div>
                                <div className="stat-label">Quality</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
