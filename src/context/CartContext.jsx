import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabaseClient';

const CartContext = createContext();

export function useCart() {
    return useContext(CartContext);
}

export function CartProvider({ children }) {
    const { currentUser } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const cartRef = React.useRef([]);

    // Truly synchronous helper to update both state and ref
    const syncState = (nextItems) => {
        cartRef.current = nextItems;
        setCartItems(nextItems);
        if (!currentUser) {
            localStorage.setItem('cart_guest', JSON.stringify(nextItems));
        }
    };

    const fetchCart = async () => {
        if (!currentUser) {
            try {
                const localData = localStorage.getItem('cart_guest');
                const items = localData ? JSON.parse(localData) : [];
                const finalItems = Array.isArray(items) ? items : [];
                cartRef.current = finalItems;
                setCartItems(finalItems);
            } catch (err) {
                console.error('Error parsing local cart:', err);
                setCartItems([]);
            }
            return;
        }

        const timeoutPromise = (ms) => new Promise((_, reject) =>
            setTimeout(() => reject(new Error('CART_FETCH_TIMEOUT')), ms)
        );

        try {
            console.log("Cart: Fetching from DB for user:", currentUser.id);
            const fetchCall = supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', currentUser.id);

            const { data, error } = await Promise.race([fetchCall, timeoutPromise(6000)]);

            if (error) throw error;
            console.log("Cart: Successfully fetched", data?.length, "items.");
            const items = Array.isArray(data) ? data : [];
            cartRef.current = items;
            setCartItems(items);
        } catch (error) {
            console.error('Cart: Error fetching from DB:', error.message);
            setCartItems([]); // Fallback to empty array on error
        }
    };

    // Load cart on start and when user changes
    useEffect(() => {
        const init = async () => {
            await fetchCart();
            setIsInitialLoad(false);
        };
        init();

        // Optional: Listen for focus to sync across tabs
        const handleFocus = () => fetchCart();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [currentUser]);

    // Merge guest cart on login
    useEffect(() => {
        if (currentUser && !isInitialLoad) {
            const guestCart = localStorage.getItem('cart_guest');
            if (guestCart) {
                const items = JSON.parse(guestCart);
                if (items.length > 0) {
                    mergeGuestCart(items);
                    localStorage.removeItem('cart_guest');
                }
            }
        }
    }, [currentUser, isInitialLoad]);

    const mergeGuestCart = async (items) => {
        for (const item of items) {
            await addToCart(item, item.quantity);
        }
        await fetchCart();
    };

    const addToCart = async (product, quantity = 1) => {
        console.log("Cart: Adding item:", product.name, "Qty Delta:", quantity);
        const prevCart = [...cartRef.current];

        // 1. Calculate NEXT state synchronously
        const existing = prevCart.find(item => item.id === product.id);
        let nextCart;
        let finalQty;

        if (existing) {
            finalQty = existing.quantity + quantity;
            nextCart = prevCart.map(item => item.id === product.id ? { ...item, quantity: finalQty } : item);
        } else {
            finalQty = quantity;
            nextCart = [...prevCart, { ...product, quantity: finalQty }];
        }

        // 2. Update UI & Ref instantly
        syncState(nextCart);

        if (!currentUser) return;

        // 3. Sync with DB
        try {
            const idParts = product.id.split('-');
            const realProductId = product.product_id || (idParts.length > 1 ? idParts.slice(0, -1).join('-') : product.id);
            const realWeight = product.weight || idParts[idParts.length - 1];

            const { error } = await supabase
                .from('cart_items')
                .upsert({
                    id: product.id,
                    user_id: currentUser.id,
                    product_id: realProductId,
                    name: product.name,
                    price: product.price,
                    quantity: finalQty,
                    weight: realWeight,
                    image_url: product.image_url,
                    updated_at: new Date()
                });

            if (error) throw error;
        } catch (error) {
            console.error('Cart: DB Sync Error:', error.message);
            syncState(prevCart); // Rollback
        }
    };

    const removeFromCart = async (id) => {
        console.log("Cart: Removing item:", id);
        const prevCart = [...cartRef.current];
        const nextCart = prevCart.filter(item => item.id !== id);

        syncState(nextCart);

        if (!currentUser) return;

        try {
            const { error } = await supabase
                .from('cart_items')
                .delete()
                .eq('id', id)
                .eq('user_id', currentUser.id);

            if (error) throw error;
        } catch (error) {
            console.error('Cart: Remove error:', error.message);
            syncState(prevCart);
        }
    };

    const updateQuantity = async (id, quantity) => {
        if (quantity < 1) {
            return removeFromCart(id);
        }

        console.log("Cart: Updating quantity:", id, "to", quantity);
        const prevCart = [...cartRef.current];
        const nextCart = prevCart.map(item => item.id === id ? { ...item, quantity } : item);

        syncState(nextCart);

        if (!currentUser) return;

        try {
            const { error } = await supabase
                .from('cart_items')
                .update({ quantity, updated_at: new Date() })
                .eq('id', id)
                .eq('user_id', currentUser.id);

            if (error) throw error;
        } catch (error) {
            console.error('Cart: Sync quantity error:', error.message);
            syncState(prevCart);
        }
    };

    const clearCart = async () => {
        if (!currentUser) {
            syncState([]);
            localStorage.removeItem('cart_guest');
            return;
        }

        try {
            const { error } = await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', currentUser.id);

            if (error) throw error;
            syncState([]);
        } catch (error) {
            console.error('Clear cart DB error:', error);
        }
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getCartBreakdown = () => {
        const subtotal = getCartTotal();
        const handlingFee = cartItems.length > 0 ? 50 : 0;
        const total = subtotal + handlingFee;
        return { subtotal, handlingFee, total };
    };

    const placeOrder = async (shippingDetails, paymentMethod) => {
        if (!currentUser) throw new Error("You must be logged in to place an order.");
        if (cartItems.length === 0) throw new Error("Cart is empty.");

        try {
            const { total } = getCartBreakdown();

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: currentUser.id,
                    status: 'pending',
                    total_amount: total,
                    payment_method: paymentMethod,
                    payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
                    shipping_address: shippingDetails
                })
                .select()
                .single();

            if (orderError) throw orderError;

            const orderItemsData = cartItems.map(item => ({
                order_id: orderData.id,
                product_id: item.product_id, // Use real product_id from DB
                quantity: item.quantity,
                price_at_time: item.price
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItemsData);

            if (itemsError) throw itemsError;

            await clearCart();
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
