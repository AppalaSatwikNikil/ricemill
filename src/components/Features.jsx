import React from 'react';
import './Features.css';

const features = [
    {
        icon: (
            <svg className="feature-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 3v19M4.5 10c0-2-1.5-3-3.5-3 .5 5 4 7.5 4 7.5S2 16 2 19s3.5 1 3.5 1h13s3.5-1 3.5-1 0-3-3-5.5 3.5-2.5 4-7.5c-2 0-3.5 1-3.5 3M12 10a7 7 0 0 0-7-7M12 10a7 7 0 0 1 7-7" />
            </svg>
        ),
        title: "Farm Fresh",
        description: "Sourced directly from our own fields and trusted local farmers, ensuring peak freshness in every grain."
    },
    {
        icon: (
            <svg className="feature-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 15l-2 5l-4-9M12 15l2 5l4-9M12 15V3M20.5 11c-1.5 0-2.5 1.5-3.5 3l-1.5 5h-7l-1.5-5c-1-1.5-2-3-3.5-3" />
            </svg>
        ),
        title: "Premium Quality",
        description: "Rigorously tested and processed in our state-of-the-art mill to meet international quality standards."
    },
    {
        icon: (
            <svg className="feature-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.2 17.6c-1.5 2.1-3.6 3.6-6 4.2-4.5 1.2-9-1.3-10.2-5.8-.5-1.9-.4-3.8.3-5.6.8-1.9 2.2-3.5 4-4.6 1.8-1.1 4-1.5 6-.9 1.1.3 2.1.8 3 1.5 1 .7 1.7 1.6 2.4 2.6.4.5.6 1.1.6 1.7 0 .8-.5 1.6-1.2 2" />
                <path d="M12 12c-1.1-2 .2-3.5 1.3-3.5s2.2 1.5 1.5 3.5-2 3.5-3.5 3.5c-.8 0-1.3-.8-.8-1.7" />
            </svg>
        ),
        title: "Eco-Friendly",
        description: "Sustainable farming practices that respect the environment while producing the healthiest rice for you."
    }
];

const Features = () => {
    return (
        <section className="features-section">
            <div className="container">
                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div className="feature-card" key={index}>
                            <div className="feature-icon-wrapper">
                                {feature.icon}
                            </div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-desc">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
