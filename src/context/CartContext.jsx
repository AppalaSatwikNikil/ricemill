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

    const fetchCart = async () => {
        if (!currentUser) {
            try {
                const localData = localStorage.getItem('cart_guest');
                const items = localData ? JSON.parse(localData) : [];
                setCartItems(Array.isArray(items) ? items : []);
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
            setCartItems(Array.isArray(data) ? data : []);
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
            await addToCart(item, item.quantity, true);
        }
        await fetchCart();
    };

    const addToCart = async (product, quantity = 1, isSilent = false) => {
        console.log("Cart: Adding to cart:", product.name, "Qty:", quantity);
        if (!currentUser) {
            setCartItems((prevItems) => {
                const existingItem = prevItems.find((item) => item.id === product.id);
                let newItems;
                if (existingItem) {
                    newItems = prevItems.map((item) =>
                        item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
                    );
                } else {
                    newItems = [...prevItems, { ...product, quantity }];
                }
                localStorage.setItem('cart_guest', JSON.stringify(newItems));
                return newItems;
            });
            return;
        }

        const timeoutPromise = (ms) => new Promise((_, reject) =>
            setTimeout(() => reject(new Error('CART_TIMEOUT')), ms)
        );

        try {
            const existingItem = cartItems.find(item => item.id === product.id);

            if (existingItem) {
                // RULE: If already in cart, increment quantity
                const newQty = existingItem.quantity + quantity;
                console.log(`Cart: Item exists. Incrementing quantity from ${existingItem.quantity} to ${newQty}`);

                const updateCall = supabase
                    .from('cart_items')
                    .update({ quantity: newQty, updated_at: new Date() })
                    .eq('id', product.id)
                    .eq('user_id', currentUser.id);

                const { error } = await Promise.race([updateCall, timeoutPromise(6000)]);
                if (error) throw error;
            } else {
                // RULE: If NOT in cart, insert with initial quantity
                const idParts = product.id.split('-');
                const parsedProductId = idParts.length > 1 ? idParts.slice(0, -1).join('-') : product.id;
                const realProductId = product.product_id || parsedProductId;
                const realWeight = product.weight || idParts[idParts.length - 1];

                console.log("Cart: Inserting new item. RealPID:", realProductId, "Weight:", realWeight);
                const insertCall = supabase
                    .from('cart_items')
                    .insert({
                        id: product.id,
                        user_id: currentUser.id,
                        product_id: realProductId,
                        name: product.name,
                        price: product.price,
                        quantity: quantity,
                        weight: realWeight,
                        image_url: product.image_url
                    });

                const { error } = await Promise.race([insertCall, timeoutPromise(6000)]);
                if (error) throw error;
            }

            console.log("Cart: DB action successful, syncing...");
            await fetchCart();
        } catch (error) {
            console.error('Cart: Add/Update error:', error.message);
            throw error;
        }
    };

    const removeFromCart = async (id) => {
        if (!currentUser) {
            setCartItems((prevItems) => {
                const newItems = prevItems.filter((item) => item.id !== id);
                localStorage.setItem('cart_guest', JSON.stringify(newItems));
                return newItems;
            });
            return;
        }

        const timeoutPromise = (ms) => new Promise((_, reject) =>
            setTimeout(() => reject(new Error('CART_REMOVE_TIMEOUT')), ms)
        );

        try {
            console.log(`Cart: Removing item ${id}`);
            const deleteCall = supabase
                .from('cart_items')
                .delete()
                .eq('id', id)
                .eq('user_id', currentUser.id);

            const { error } = await Promise.race([deleteCall, timeoutPromise(6000)]);

            if (error) throw error;
            console.log("Cart: Remove successful, fetching...");
            await fetchCart();
        } catch (error) {
            console.error('Cart: Remove from cart DB error:', error.message);
            throw error;
        }
    };

    const updateQuantity = async (id, quantity) => {
        // RULE: If quantity = 0 (or less), remove from cart
        if (quantity < 1) {
            console.log(`Cart: Quantity for ${id} is 0. Removing...`);
            await removeFromCart(id);
            return;
        }

        if (!currentUser) {
            setCartItems((prevItems) => {
                const newItems = prevItems.map((item) => item.id === id ? { ...item, quantity } : item);
                localStorage.setItem('cart_guest', JSON.stringify(newItems));
                return newItems;
            });
            return;
        }

        const timeoutPromise = (ms) => new Promise((_, reject) =>
            setTimeout(() => reject(new Error('CART_TIMEOUT')), ms)
        );

        try {
            console.log(`Cart: Updating quantity in Supabase for ${id} to ${quantity}`);
            const updateCall = supabase
                .from('cart_items')
                .update({ quantity, updated_at: new Date() })
                .eq('id', id)
                .eq('user_id', currentUser.id);

            const { error } = await Promise.race([updateCall, timeoutPromise(6000)]);
            if (error) throw error;

            console.log("Cart: Update successful, syncing UI...");
            await fetchCart();
        } catch (error) {
            console.error('Cart: Update quantity error:', error.message);
            throw error;
        }
    };

    const clearCart = async () => {
        if (!currentUser) {
            setCartItems([]);
            localStorage.removeItem('cart_guest');
            return;
        }

        try {
            const { error } = await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', currentUser.id);

            if (error) throw error;
            setCartItems([]);
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
