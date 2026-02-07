import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity, getCartBreakdown } = useCart();
    const navigate = useNavigate();
    const { subtotal, handlingFee, total } = getCartBreakdown ? getCartBreakdown() : { subtotal: 0, handlingFee: 0, total: 0 };

    if (cartItems.length === 0) {
        return (
            <div className="cart-empty">
                <h2>Your Cart is Empty</h2>
                <p>Looks like you haven't added any products yet.</p>
                <Link to="/" className="continue-shopping">Start Shopping</Link>
            </div>
        );
    }

    return (
        <div className="cart-container">
            <h1>Shopping Cart</h1>
            <div className="cart-content">
                <div className="cart-items">
                    {cartItems.map((item) => (
                        <div key={item.id} className="cart-item">
                            <img src={item.image_url || "/assets/product-placeholder.png"} alt={item.name} className="cart-item-image" />
                            <div className="cart-item-details">
                                <h3>{item.name}</h3>
                                <p className="cart-item-price">₹{item.price}</p>
                            </div>
                            <div className="cart-item-actions">
                                <div className="quantity-controls">
                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                </div>
                                {/* Remove as per request */}
                            </div>
                            <div className="cart-item-total">
                                ₹{item.price * item.quantity}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="cart-summary">
                    <h2>Order Summary</h2>
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>₹{subtotal}</span>
                    </div>
                    {handlingFee > 0 && (
                        <div className="summary-row">
                            <span>Handling Fee</span>
                            <span>₹{handlingFee}</span>
                        </div>
                    )}
                    <div className="summary-row">
                        <span>Shipping</span>
                        <span>Free</span>
                    </div>
                    <div className="summary-total">
                        <span>Total</span>
                        <span>₹{total}</span>
                    </div>
                    <button className="checkout-btn" onClick={() => navigate('/checkout')}>
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;
