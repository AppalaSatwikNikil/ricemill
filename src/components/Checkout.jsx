import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

const Checkout = () => {
    const { cartItems, getCartBreakdown, placeOrder, processPaymentSuccess, handleCODFinalize } = useCart();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        address: '',
        city: '',
        zipCode: '',
        phone: ''
    });

    const { subtotal, handlingFee, total } = getCartBreakdown ? getCartBreakdown() : { subtotal: 0, handlingFee: 0, total: 0 };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePaymentChange = (e) => {
        setPaymentMethod(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (cartItems.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        setLoading(true);
        try {
            // 1. Create a PENDING order first
            const orderId = await placeOrder(formData, paymentMethod);

            if (paymentMethod === 'cod') {
                // 2a. Simple COD flow
                await handleCODFinalize(orderId);
                navigate(`/order-success/${orderId}`);
            } else {
                // 2b. Razorpay Flow
                handleRazorpayPayment(orderId);
            }
        } catch (error) {
            console.error("Checkout Error:", error);
            alert("Failed to initiate order: " + error.message);
            setLoading(false);
        }
    };

    const handleRazorpayPayment = async (orderDbId) => {
        const { total } = getCartBreakdown();
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

        try {
            // 1. Create Razorpay Order on Backend
            const orderResponse = await fetch(`${backendUrl}/api/payment/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: total, // amount in INR
                    currency: "INR",
                    receipt: `receipt_${orderDbId}`
                })
            });

            if (!orderResponse.ok) throw new Error("Failed to create Razorpay order");
            const rzpOrder = await orderResponse.json();

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                name: "Santi Rice Mill",
                description: "Premium Rice Order",
                image: "https://your-logo-url.com/logo.png",
                order_id: rzpOrder.id,
                handler: async (response) => {
                    try {
                        console.log("Razorpay Success Response:", response);

                        // 2. Verify Payment on Backend
                        const verifyResponse = await fetch(`${backendUrl}/api/payment/verify-payment`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyResult = await verifyResponse.json();

                        if (verifyResult.status === 'success') {
                            // 3. Finalize in Supabase ONLY after verification success
                            await processPaymentSuccess(orderDbId);
                            alert("Payment Successful! Your order is being processed.");
                            navigate('/orders');
                        } else {
                            throw new Error("Payment verification failed");
                        }
                    } catch (err) {
                        console.error("Payment Verification/Finalization Error:", err);
                        alert("There was a problem verifying your payment. Please contact support.");
                        setLoading(false);
                    }
                },
                prefill: {
                    name: formData.fullName,
                    email: currentUser?.email || "",
                    contact: formData.phone
                },
                notes: {
                    order_db_id: orderDbId
                },
                theme: {
                    color: "#8b4513"
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                        console.log("Payment Modal Dismissed");
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Razorpay Initiation Error:", error);
            alert("Failed to start Razorpay payment: " + error.message);
            setLoading(false);
        }
    };

    return (
        <div className="checkout-container">
            <h1>Checkout</h1>
            <div className="checkout-content">
                <div className="checkout-form-section">
                    <h2>Shipping Details</h2>
                    <form id="checkout-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>ZIP Code</label>
                                <input
                                    type="text"
                                    name="zipCode"
                                    value={formData.zipCode}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <h2>Payment Method</h2>
                        <div className="payment-options">
                            <div className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    id="cod"
                                    name="payment"
                                    value="cod"
                                    checked={paymentMethod === 'cod'}
                                    onChange={handlePaymentChange}
                                />
                                <label htmlFor="cod">
                                    <span className="payment-title">Cash on Delivery</span>
                                    <span className="payment-desc">Pay when you receive your order</span>
                                </label>
                            </div>

                            {/* Razorpay hidden as per user request */}
                            {/* 
                            <div className={`payment-option ${paymentMethod === 'razorpay' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    id="razorpay"
                                    name="payment"
                                    value="razorpay"
                                    checked={paymentMethod === 'razorpay'}
                                    onChange={handlePaymentChange}
                                />
                                <label htmlFor="razorpay">
                                    <span className="payment-title">Pay via Razorpay</span>
                                    <span className="payment-desc">UPI, Cards, Netbanking</span>
                                </label>
                            </div> 
                            */}
                        </div>

                        <div className="checkout-actions-inline" style={{ marginTop: '2rem' }}>
                            <button type="submit" form="checkout-form" className="btn btn-primary place-order-btn-inline" disabled={loading} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                                {loading ? 'Processing...' : 'Proceed with Cash on Delivery'}
                            </button>
                        </div>

                    </form>
                </div>

                <div className="order-summary">
                    <h2>Order Summary</h2>
                    <div className="summary-items">
                        {cartItems.map(item => (
                            <div key={item.id} className="summary-item">
                                <span>{item.name} x {item.quantity}</span>
                                <span>₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>
                    <div className="summary-total-row" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Subtotal</span>
                            <span>₹{subtotal}</span>
                        </div>
                        {handlingFee > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--color-text-light)' }}>
                                <span>Handling Fee</span>
                                <span>₹{handlingFee}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '1rem' }}>
                            <span>Total Amount</span>
                            <span>₹{total}</span>
                        </div>
                    </div>

                    {/* Main button moved inline under payment options, but keeping a summary button for UX if needed, or removing it if it clashes */}
                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#666', marginTop: '1rem' }}>
                        Click the button above to confirm your order.
                    </p>
                    {loading && <p style={{ textAlign: 'center', marginTop: '10px' }}>Please wait, placing your order...</p>}
                </div>
            </div >
        </div >
    );
};

export default Checkout;
