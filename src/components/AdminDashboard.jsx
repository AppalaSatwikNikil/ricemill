import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    profiles:user_id (full_name, email),
                    order_items (
                        *,
                        products (name)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            // Optimistic update
            setOrders(orders.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(order => order.status === filter);

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Admin Dashboard</h1>
                <div className="admin-stats">
                    <div className="stat-card">
                        <h3>Total Orders</h3>
                        <p>{orders.length}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Pending</h3>
                        <p>{orders.filter(o => o.status === 'pending').length}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Revenue</h3>
                        <p>₹{orders.reduce((acc, curr) => acc + (curr.payment_status === 'paid' ? curr.total_amount : 0), 0)}</p>
                    </div>
                </div>
            </header>

            <div className="orders-section">
                <div className="orders-filters">
                    <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
                    <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pending</button>
                    <button className={filter === 'processing' ? 'active' : ''} onClick={() => setFilter('processing')}>Processing</button>
                    <button className={filter === 'shipped' ? 'active' : ''} onClick={() => setFilter('shipped')}>Shipped</button>
                    <button className={filter === 'delivered' ? 'active' : ''} onClick={() => setFilter('delivered')}>Delivered</button>
                </div>

                {loading ? (
                    <div className="loading">Loading orders...</div>
                ) : (
                    <div className="orders-list">
                        {filteredOrders.map(order => (
                            <div key={order.id} className="order-card">
                                <div className="order-header">
                                    <div>
                                        <span className="order-id">#{order.id.slice(0, 8)}</span>
                                        <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className={`status-badge ${order.status}`}>{order.status.toUpperCase()}</div>
                                </div>

                                <div className="order-customer">
                                    <strong>{order.profiles?.full_name || 'Unknown User'}</strong>
                                    <span>{order.profiles?.email}</span>
                                </div>

                                <div className="order-items-list">
                                    {order.order_items.map(item => (
                                        <div key={item.id} className="order-item-row">
                                            <span>{item.quantity}x {item.products?.name}</span>
                                            <span>₹{item.price_at_time}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="order-footer">
                                    <div className="order-total">
                                        Total: ₹{order.total_amount}
                                        <span className={`payment-badge ${order.payment_method}`}>{order.payment_method}</span>
                                    </div>

                                    <div className="order-actions">
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
