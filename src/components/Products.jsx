import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './Products.css';

const ProductCard = ({ product }) => {
    const [selectedWeight, setSelectedWeight] = useState("5kg"); // Default weight
    const [actionLoading, setActionLoading] = useState(false);
    const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();

    const options = ["5kg", "10kg", "25kg"];
    const cartItemId = `${product.id}-${selectedWeight}`;
    const cartItem = cartItems.find(item => item.id === cartItemId);
    const quantity = cartItem ? cartItem.quantity : 0;

    const handleIncrease = async () => {
        setActionLoading(true);
        try {
            if (cartItem) {
                await updateQuantity(cartItemId, quantity + 1);
            } else {
                await addToCart(
                    {
                        ...product,
                        id: cartItemId,
                        product_id: product.id,
                        weight: selectedWeight,
                        name: `${product.name} (${selectedWeight})`
                    },
                    1
                );
            }
        } catch (err) {
            console.error("Action failed:", err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDecrease = async () => {
        if (quantity === 0) return;
        setActionLoading(true);
        try {
            if (quantity > 1) {
                await updateQuantity(cartItemId, quantity - 1);
            } else {
                await removeFromCart(cartItemId);
            }
        } catch (err) {
            console.error("Action failed:", err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (!actionLoading) {
            handleIncrease();
        }
    };

    return (
        <div className={`product-card ${actionLoading ? 'processing' : ''}`}>
            <div className="product-image-container">
                <img src={product.image_url || "/assets/product-placeholder.png"} alt={product.name} className="product-image" />
                {actionLoading && <div className="card-overlay"><div className="spinner-mini"></div></div>}
            </div>
            <div className="product-details">
                <h3 className="product-title">{product.name}</h3>
                <p className="product-desc">{product.description}</p>

                <div className="weight-options">
                    {options.map(opt => (
                        <button
                            key={opt}
                            className={`weight-btn ${selectedWeight === opt ? 'active' : ''}`}
                            onClick={() => !actionLoading && setSelectedWeight(opt)}
                            disabled={actionLoading}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                <div className="product-price">
                    ₹{product.price} <span className="price-unit">/ {selectedWeight}</span>
                </div>

                <div className="product-actions">
                    <div className="quantity-selector">
                        <button onClick={handleDecrease} disabled={quantity === 0 || actionLoading}>−</button>
                        <span>{quantity}</span>
                        <button onClick={handleIncrease} disabled={actionLoading}>+</button>
                    </div>
                    <div className="product-buttons">
                        <button
                            className="add-to-cart-btn"
                            onClick={handleAddToCart}
                            disabled={actionLoading}
                        >
                            {actionLoading ? '...' : (quantity > 0 ? `In Cart (${quantity})` : 'Add to Cart')}
                        </button>
                        <button
                            className="buy-now-btn"
                            disabled={actionLoading}
                            onClick={async () => {
                                if (quantity === 0) {
                                    await handleIncrease();
                                }
                                window.location.href = '/checkout';
                            }}
                        >
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { currentUser } = useAuth();

    const [debugStatus, setDebugStatus] = useState('Initializing...');
    const [activeDebug, setActiveDebug] = useState(false);
    const fetchInProgress = useRef(false);

    useEffect(() => {
        if (currentUser) {
            fetchProducts();
        } else {
            setProducts([]);
            setLoading(false);
        }
    }, [currentUser]);

    const fetchProducts = async () => {
        if (fetchInProgress.current) return;

        setActiveDebug(true);
        fetchInProgress.current = true;
        setLoading(true);
        setError(null);
        setDebugStatus('Starting multi-path fetch...');

        const timeoutPromise = (ms) => new Promise((_, reject) =>
            setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), ms)
        );

        try {
            console.log("Products: Trying Supabase Client path...");
            setDebugStatus('Querying via Supabase Client...');

            // Try Supabase client with a 7s timeout
            const supabasePromise = supabase.from('products').select('*');
            const data = await Promise.race([supabasePromise, timeoutPromise(7000)]);

            if (data.error) throw data.error;

            console.log("Products: Supabase Client success!", data.data?.length);
            setProducts(data.data || []);
            setDebugStatus(`Success! Loaded ${data.data?.length} products.`);
        } catch (err) {
            console.error('Products: Supabase Client path failed:', err);

            if (err.message === 'NETWORK_TIMEOUT') {
                setDebugStatus('Client timed out. Trying Direct API Fetch...');
                try {
                    // Fallback to direct REST API call if the client library is hanging
                    const directUrl = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/products?select=*`;
                    const directResponse = await Promise.race([
                        fetch(directUrl, {
                            headers: {
                                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                            }
                        }),
                        timeoutPromise(5000)
                    ]);

                    if (!directResponse.ok) throw new Error(`API returned ${directResponse.status}`);

                    const directData = await directResponse.json();
                    console.log("Products: Direct API Path success!", directData?.length);
                    setProducts(directData || []);
                    setDebugStatus(`Loaded via API Fallback (${directData?.length} items).`);
                } catch (fallbackErr) {
                    console.error('Products: Fallback path also failed:', fallbackErr);
                    setError(`Connection Error: ${fallbackErr.message}. Please check if an ad-blocker is blocking Supabase.`);
                    setDebugStatus(`Critical failure: ${fallbackErr.message}`);
                }
            } else {
                setError(`Database Error: ${err.message}`);
                setDebugStatus(`Failed: ${err.message}`);
            }
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            console.log("Products: Fetch cycle complete.");
        }
    };

    return (
        <section id="products" className="products-section section-padding">
            <div className="container">
                <div className="products-header text-center">
                    <div className="section-tag">Our Products</div>
                    <h2 className="section-title">Premium Rice Collection</h2>
                    <p className="section-subtitle">
                        Choose from our wide variety of carefully selected rice, directly sourced from the best farms and milled to perfection.
                    </p>
                </div>

                {!currentUser ? (
                    <div className="auth-notice text-center" style={{ padding: '4rem 0' }}>
                        <h3>Please Log In</h3>
                        <p>You must be logged in to view and purchase our premium rice collection.</p>
                        <a href="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>Login Now</a>
                    </div>
                ) : loading ? (
                    <div className="loading-state text-center" style={{ padding: '4rem 0' }}>
                        <div className="spinner"></div>
                        <p>Loading products...</p>
                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '1rem' }}>Status: {debugStatus}</p>
                        <button
                            onClick={() => { fetchInProgress.current = false; fetchProducts(); }}
                            className="btn btn-outline"
                            style={{ marginTop: '1rem', fontSize: '0.8rem' }}
                        >
                            Retry Connection
                        </button>
                    </div>
                ) : error ? (
                    <div className="error-state text-center" style={{ padding: '2rem 0' }}>
                        <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
                        <button onClick={fetchProducts} className="btn btn-outline">Retry Loading</button>
                    </div>
                ) : products.length === 0 ? (
                    <div className="empty-state text-center" style={{ padding: '4rem 0' }}>
                        <p>No products available at the moment.</p>
                    </div>
                ) : (
                    <div className="products-grid">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Products;
