import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './OrderSuccess.css';

const OrderSuccess = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        // Optional: Add logic to verify order existence or clear local session state if needed
    }, [orderId]);

    return (
        <div className="success-container">
            <div className="success-card">
                <div className="animation-container">
                    <div className="checkmark-circle">
                        <div className="background"></div>
                        <div className="checkmark draw"></div>
                    </div>
                </div>

                <h1 className="success-title">Order Confirmed!</h1>
                <p className="success-message">
                    Thank you for your purchase. Your order <strong>#{orderId?.slice(0, 8)}</strong> has been placed successfully via Cash on Delivery.
                </p>

                <div className="success-details">
                    <p>Our team will contact you shortly for confirmation.</p>
                </div>

                <div className="success-actions">
                    <Link to="/orders" className="btn btn-primary">Track My Orders</Link>
                    <Link to="/" className="btn btn-outline">Continue Shopping</Link>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
