import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';
import './Products.css';

const ProductCard = ({ product }) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedWeight, setSelectedWeight] = useState("5kg"); // Default weight (or fetch from DB if we had variants)
    const { addToCart } = useCart();

    // Mock options since we don't have separate product_variants table yet
    const options = ["5kg", "10kg", "25kg"];

    const handleAddToCart = () => {
        addToCart(
            { ...product, name: `${product.name} (${selectedWeight})` },
            quantity
        );
        alert(`Added ${quantity} x ${product.name} to cart`);
    };

    return (
        <div className="product-card">
            <div className="product-image-container">
                {/* {product.badge && <span className={`product-badge ${product.badge.toLowerCase().replace(' ', '-')}`}>{product.badge}</span>} */}
                {/* Fallback image if url is missing or placeholder */}
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

                <div className="product-actions">
                    <div className="quantity-selector">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                        <span>{quantity}</span>
                        <button onClick={() => setQuantity(quantity + 1)}>+</button>
                    </div>
                    <div className="product-buttons">
                        <button className="add-to-cart-btn" onClick={handleAddToCart}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                            Add to Cart
                        </button>
                        <button className="buy-now-btn" onClick={() => {
                            addToCart({ ...product, name: `${product.name} (${selectedWeight})` }, quantity);
                            // Immediate redirect to checkout context? 
                            // We need to access navigate here. 
                            // But ProductCard is inside Products. 
                            // We can pass navigate or use hook.
                            window.location.href = '/checkout'; // Simple redirect for now
                        }}>
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

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // calculated "is_active" eq true manually if needed, or add to query string
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            setProducts(data || []);
        } catch (err) {
            console.error('Supabase SDK fetch failed:', err);

            // Fallback: Try direct REST fetch
            try {
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase Env vars for fallback");

                const response = await fetch(`${supabaseUrl}/rest/v1/products?is_active=eq.true&select=*&order=name.asc`, {
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Fallback fetch failed: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                setProducts(data || []);
                // Clear error if fallback succeeded
                setError(null);
            } catch (fallbackErr) {
                console.error('Fallback fetch also failed:', fallbackErr);
                setError(`Failed to load products. SDK Error: ${err.message}. Fallback Error: ${fallbackErr.message}`);
            }
        } finally {
            setLoading(false);
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

                {loading ? (
                    <div className="loading-state text-center" style={{ padding: '4rem 0' }}>
                        <div className="spinner"></div>
                        <p>Loading products...</p>
                    </div>
                ) : error ? (
                    <div className="error-state text-center" style={{ color: 'red', padding: '2rem 0' }}>
                        {error}
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
