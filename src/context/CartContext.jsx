import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabaseClient';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [cartItems, setCartItems] = useState([]);

    // Load cart when user changes
    useEffect(() => {
        const cartKey = currentUser ? `cart_${currentUser.email}` : 'cart_guest';
        try {
            const localData = localStorage.getItem(cartKey);
            setCartItems(localData ? JSON.parse(localData) : []);
        } catch {
            setCartItems([]);
        }
    }, [currentUser]);

    // Save cart when items change
    useEffect(() => {
        const cartKey = currentUser ? `cart_${currentUser.email}` : 'cart_guest';
        localStorage.setItem(cartKey, JSON.stringify(cartItems));
    }, [cartItems, currentUser]);

    const addToCart = (product, quantity = 1) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.id === product.id);
            if (existingItem) {
                return prevItems.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
                );
            }
            return [...prevItems, { ...product, quantity }];
        });
    };

    const removeFromCart = (id) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    };

    const updateQuantity = (id, quantity) => {
        if (quantity < 1) {
            removeFromCart(id);
            return;
        }
        setCartItems((prevItems) =>
            prevItems.map((item) => item.id === id ? { ...item, quantity } : item)
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getCartBreakdown = () => {
        const subtotal = getCartTotal();
        const handlingFee = cartItems.length > 0 ? 50 : 0; // Flat fee of ₹50 if cart not empty
        const total = subtotal + handlingFee;
        return { subtotal, handlingFee, total };
    };

    const placeOrder = async (shippingDetails, paymentMethod) => {
        if (!currentUser) throw new Error("You must be logged in to place an order.");
        if (cartItems.length === 0) throw new Error("Cart is empty.");

        try {
            const { total } = getCartBreakdown();

            // 1. Create Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: currentUser.id,
                    status: 'pending',
                    total_amount: total,
                    payment_method: paymentMethod, // 'cod' or 'online'
                    payment_status: paymentMethod === 'cod' ? 'pending' : 'paid', // Simplify for MVP
                    shipping_address: shippingDetails
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Order Items
            const orderItemsData = cartItems.map(item => ({
                order_id: orderData.id,
                product_id: item.id,
                quantity: item.quantity,
                price_at_time: item.price
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItemsData);

            if (itemsError) throw itemsError;

            // 3. Clear Cart
            clearCart();

            // 4. Return Order ID (for success page or email trigger)
            return orderData.id;

        } catch (error) {
            console.error("Place Order Error:", error);
            throw error;
        }
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            getCartBreakdown,
            placeOrder
        }}>
            {children}
        </CartContext.Provider>
    );
};
