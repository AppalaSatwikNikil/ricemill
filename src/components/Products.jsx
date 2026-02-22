import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './Products.css';

const ProductCard = ({ product }) => {
    const [selectedWeight, setSelectedWeight] = useState("5kg"); // Default weight
    const { cartItems, addToCart, updateQuantity, removeFromCart, generateItemId } = useCart();
    const navigate = useNavigate();
    const options = ["5kg", "10kg", "25kg"];

    // 1. Calculate items for THIS product across all weights
    const productItemsInCart = cartItems.filter(item =>
        (item.product_id === product.id || item.id?.includes(`-${product.id}-`))
    );
    const totalQtyInCart = productItemsInCart.reduce((sum, item) => sum + item.quantity, 0);

    // 2. Auto-select weight on mount if something is already in cart
    useEffect(() => {
        if (productItemsInCart.length > 0 && selectedWeight === "5kg") {
            // Find the first weight that is actually in the cart
            const itemInCart = productItemsInCart[0];
            if (itemInCart && itemInCart.weight && options.includes(itemInCart.weight)) {
                setSelectedWeight(itemInCart.weight);
            }
        }
    }, [productItemsInCart.length]);

    // 3. Specific state for selected weight
    const cartItemId = generateItemId(product.id, selectedWeight);
    const cartItem = cartItems.find(item => item.id === cartItemId);
    const quantity = cartItem ? cartItem.quantity : 0;

    const handleIncrease = () => {
        addToCart(
            {
                ...product,
                id: cartItemId,
                product_id: product.id,
                weight: selectedWeight,
                name: `${product.name} (${selectedWeight})`
            },
            1
        );
    };

    const handleDecrease = () => {
        if (quantity === 0) return;
        updateQuantity(cartItemId, quantity - 1);
    };

    const handleAddToCart = () => {
        handleIncrease();
    };

    const handleBuyNow = async () => {
        if (quantity === 0) {
            await addToCart(product, 1);
        }
        navigate('/cart');
    };

    return (
        <div className="product-card">
            <div className="product-image-container">
                <img src={product.image_url || "/assets/product-placeholder.png"} alt={product.name} className="product-image" />
            </div>
            <div className="product-details">
                <h3 className="product-title">{product.name}</h3>
                <p className="product-desc">{product.description}</p>

                <div className="weight-options">
                    {options.map(opt => (
                        <button
                            key={opt}
                            className={`weight-btn ${selectedWeight === opt ? 'active' : ''}`}
                            onClick={() => setSelectedWeight(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                <div className="product-price">
                    ₹{product.price} <span className="price-unit">/ {selectedWeight}</span>
                </div>

                {totalQtyInCart > 0 && (
                    <div className="total-cart-badge">
                        {totalQtyInCart} total in cart
                        {productItemsInCart.length > 1 && ` (${productItemsInCart.length} sizes)`}
                    </div>
                )}

                <div className="product-actions">
                    <div className="quantity-selector">
                        <button onClick={handleDecrease} disabled={quantity === 0}>−</button>
                        <span>{quantity}</span>
                        <button onClick={handleIncrease}>+</button>
                    </div>
                    <div className="product-buttons">
                        <button
                            className="add-to-cart-btn"
                            onClick={handleAddToCart}
                        >
                            {quantity > 0 ? `In Cart (${quantity})` : 'Add to Cart'}
                        </button>
                        <button
                            className="buy-now-btn"
                            style={{ backgroundColor: 'var(--color-green)', color: 'white', fontWeight: 'bold' }}
                            onClick={async () => {
                                if (quantity === 0) {
                                    await addToCart(product, 1);
                                }
                                navigate('/checkout');
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
    const navigate = useNavigate();

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

        fetchInProgress.current = true;
        setLoading(true);
        setError(null);
        setDebugStatus('Fetching products...');

        try {
            console.log("Products: Querying Supabase...");
            const { data, error } = await supabase.from('products').select('*');

            if (error) throw error;

            console.log("Products: Success!", data?.length, "items loaded.");
            setProducts(data || []);
            setDebugStatus(`Loaded ${data?.length} products successfully.`);
        } catch (err) {
            console.error('Products: Fetch failed:', err);
            setError(`Database Error: ${err.message}`);
            setDebugStatus(`Failed: ${err.message}`);
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
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
