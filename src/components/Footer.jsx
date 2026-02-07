import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-top">
                    <div className="footer-brand column">
                        <div className="logo white">
                            <div className="logo-icon">S</div>
                            <div className="logo-text">
                                <span className="brand-name">Santi Rice Mill</span>
                                <span className="brand-tagline">Premium Quality Rice</span>
                            </div>
                        </div>
                        <p className="footer-desc">
                            Delivering premium quality rice directly from our mill to your doorstep. Trusted by families for over 25 years.
                        </p>
                        <div className="social-links">
                            <a href="#" className="social-link" aria-label="Facebook">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                            </a>
                            <a href="#" className="social-link" aria-label="Instagram">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                            </a>
                            <a href="#" className="social-link" aria-label="Twitter">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /></svg>
                            </a>
                        </div>
                    </div>

                    <div className="footer-links-group">
                        <div className="column">
                            <h4 className="column-title">Quick Links</h4>
                            <ul className="footer-links">
                                <li><a href="#home">Home</a></li>
                                <li><a href="#products">Products</a></li>
                                <li><a href="#about">About Us</a></li>
                                <li><a href="#contact">Contact</a></li>
                            </ul>
                        </div>

                        <div className="column">
                            <h4 className="column-title">Products</h4>
                            <ul className="footer-links">
                                <li><a href="#">Basmati Rice</a></li>
                                <li><a href="#">Sona Masoori</a></li>
                                <li><a href="#">Brown Rice</a></li>
                                <li><a href="#">Organic Rice</a></li>
                            </ul>
                        </div>

                        <div className="column">
                            <h4 className="column-title">Support</h4>
                            <ul className="footer-links">
                                <li><a href="#">FAQ</a></li>
                                <li><a href="#">Shipping Policy</a></li>
                                <li><a href="#">Returns</a></li>
                                <li><a href="#">Track Order</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} Santi Rice Mill. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
