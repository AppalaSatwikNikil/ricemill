import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = () => {
            const session = localStorage.getItem('santi_admin_session');
            if (!session) {
                navigate('/admin/login');
                return false;
            }
            const parsed = JSON.parse(session);
            if (new Date().getTime() > parsed.expiry) {
                localStorage.removeItem('santi_admin_session');
                navigate('/admin/login');
                return false;
            }
            return true;
        };

        if (checkAuth()) {
            fetchOrders();
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('santi_admin_session');
        navigate('/admin/login');
    };

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
                .eq('admin_hidden', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const hideOrder = async (orderId) => {
        const confirmed = window.confirm("Are you sure you want to HIDE this order from the dashboard? It will still be visible to the customer.");
        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('orders')
                .update({ admin_hidden: true })
                .eq('id', orderId);

            if (error) throw error;

            // Update local state
            setOrders(orders.filter(order => order.id !== orderId));
        } catch (error) {
            console.error('Error hiding order:', error);
            alert('Failed to hide order. Make sure you have added the "admin_hidden" column to your database.');
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        if (newStatus === 'cancelled') {
            const confirmed = window.confirm("Are you sure you want to CANCEL this order? This action cannot be easily undone.");
            if (!confirmed) return;
        }

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '20px' }}>
                    <h1>Admin Dashboard</h1>
                    <button onClick={handleLogout} className="btn btn-outline" style={{ fontSize: '0.8rem' }}>Admin Logout</button>
                </div>
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
                    <button className={filter === 'cancelled' ? 'active' : ''} onClick={() => setFilter('cancelled')}>Cancelled</button>
                </div>

                {loading ? (
                    <div className="loading">Loading orders...</div>
                ) : (
                    <div className="orders-list">
                        {filteredOrders.map(order => (
                            <div key={order.id} className="order-card">
                                {(order.status === 'cancelled' || order.status === 'delivered') && (
                                    <button
                                        className="btn-remove-alt"
                                        onClick={() => hideOrder(order.id)}
                                        title="Hide order from admin dashboard"
                                    >
                                        &times;
                                    </button>
                                )}
                                <div className="order-header">
                                    <div>
                                        <span className="order-id">#{order.id.slice(0, 8)}</span>
                                        <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className={`status-badge ${order.status}`}>{order.status.toUpperCase()}</div>
                                </div>

                                <div className="order-customer">
                                    <strong>{order.shipping_address?.fullName || order.profiles?.full_name || 'Unknown User'}</strong>
                                    <span>{order.profiles?.email}</span>
                                    {order.shipping_address?.phone && <div style={{ fontSize: '0.8rem', color: '#666' }}>📞 {order.shipping_address.phone}</div>}
                                    {order.shipping_address?.address && <div style={{ fontSize: '0.8rem', color: '#888' }}>🏠 {order.shipping_address.address}, {order.shipping_address.city}</div>}
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
                                        <button
                                            className="btn btn-cancel"
                                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                            disabled={order.status === 'cancelled'}
                                        >
                                            Cancel Order
                                        </button>
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
