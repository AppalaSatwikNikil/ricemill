import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './Orders.css';

const Orders = () => {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            fetchOrders();
        }
    }, [currentUser]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            // Fetch orders with their items and product details
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *,
                        products (*)
                    )
                `)
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error("Error fetching orders:", error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="orders-container text-center">
                <div className="spinner" style={{ margin: '100px auto' }}></div>
                <p>Loading your orders...</p>
            </div>
        );
    }

    return (
        <div className="orders-container">
            <h1 className="orders-title">My Orders</h1>

            {!currentUser ? (
                <div className="no-orders">
                    <p>Please log in to view your orders.</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="no-orders">
                    <p>You haven't placed any orders yet.</p>
                    <a href="/products" className="btn btn-primary" style={{ marginTop: '20px' }}>Shop Rice Now</a>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map(order => (
                        <div key={order.id} className="order-card">
                            <div className="order-header">
                                <span className="order-id">Order ID: #{order.id.slice(0, 8)}</span>
                                <span className="order-date">
                                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>

                            <div className="order-body">
                                <div className="order-items-list">
                                    {order.order_items.map(item => (
                                        <div key={item.id} className="order-item-row">
                                            <div className="item-info">
                                                <strong>{item.products?.name || "Premium Rice"}</strong>
                                                <span style={{ marginLeft: '10px', color: '#666' }}>({item.weight})</span>
                                            </div>
                                            <div className="item-price">
                                                {item.quantity} x ₹{item.price_at_time} = <strong>₹{item.quantity * item.price_at_time}</strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="order-footer">
                                <div className="order-meta-item">
                                    <span className="meta-label">Total Amount</span>
                                    <span className="meta-value">₹{order.total_amount}</span>
                                </div>
                                <div className="order-meta-item">
                                    <span className="meta-label">Payment</span>
                                    <span className="meta-value">
                                        {order.payment_method?.toUpperCase()}
                                        <span className={`payment-status-badge payment-${order.payment_status}`}>
                                            ({order.payment_status})
                                        </span>
                                    </span>
                                </div>
                                <div className="order-meta-item">
                                    <span className="meta-label">Order Status</span>
                                    <span className={`status-badge status-${order.status}`}>
                                        {order.status}
                                    </span>
                                </div>
                                {order.shipping_address && (
                                    <div className="order-meta-item" style={{ gridColumn: 'span 2' }}>
                                        <span className="meta-label">Deliver To</span>
                                        <span className="meta-value" style={{ fontSize: '0.9rem', fontWeight: '400' }}>
                                            {order.shipping_address.fullName}, {order.shipping_address.address}, {order.shipping_address.city} - {order.shipping_address.zipCode}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Orders;
