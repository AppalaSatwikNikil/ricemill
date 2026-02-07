import React from 'react';
import './Contact.css';

const Contact = () => {
    return (
        <section id="contact" className="contact-section section-padding">
            <div className="container">
                <div className="text-center mb-5">
                    <div className="section-tag">Contact Us</div>
                    <h2 className="section-title">Get in Touch</h2>
                    <p className="section-subtitle">
                        Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                    </p>
                </div>

                <div className="contact-container">
                    {/* Left: Contact Form */}
                    <div className="contact-form-card">
                        <h3 className="card-title">Send us a Message</h3>
                        <form className="contact-form">
                            <div className="form-group-row">
                                <div className="form-group">
                                    <label htmlFor="name">Name</label>
                                    <input type="text" id="name" placeholder="Your name" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phone">Phone</label>
                                    <input type="tel" id="phone" placeholder="+91 XXXXX XXXXX" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input type="email" id="email" placeholder="your@email.com" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="message">Message</label>
                                <textarea id="message" rows="4" placeholder="Your message..."></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary submit-btn">Send Message</button>
                        </form>
                    </div>

                    {/* Right: Info + Map */}
                    <div className="contact-info-wrapper">
                        <div className="info-cards-grid">
                            <div className="info-card">
                                <div className="info-icon">📍</div>
                                <div>
                                    <h4>Address</h4>
                                    <p>123 Mill Road,<br />Rice Town, RT 12345</p>
                                </div>
                            </div>
                            <div className="info-card">
                                <div className="info-icon">📞</div>
                                <div>
                                    <h4>Phone</h4>
                                    <p>+91 98765 43210</p>
                                </div>
                            </div>
                            <div className="info-card">
                                <div className="info-icon">✉️</div>
                                <div>
                                    <h4>Email</h4>
                                    <p>info@santiricemill.com</p>
                                </div>
                            </div>
                            <div className="info-card">
                                <div className="info-icon">🕒</div>
                                <div>
                                    <h4>Working Hours</h4>
                                    <p>Mon - Sat: 9 AM - 6 PM</p>
                                </div>
                            </div>
                        </div>

                        {/* Map Placeholder */}
                        <div className="map-container">
                            {/* Replace with actual map embed or image */}
                            <img src="/assets/map-placeholder.png" alt="Map Location" className="map-img" />
                            <div className="map-pin">📍</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
