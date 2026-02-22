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
    const lastSessionId = React.useRef(null);

    // Truly synchronous helper to update BOTH state and ref
    const syncState = (nextItems) => {
        cartRef.current = nextItems;
        setCartItems(nextItems);
        // Only persist guest cart to localStorage
        if (!currentUser) {
            localStorage.setItem('cart_guest', JSON.stringify(nextItems));
        }
    };

    // Stable ID generation to prevent multi-user collisions in the shared DB
    const generateItemId = (productId, weight) => {
        const prefix = currentUser ? currentUser.id : 'guest';
        return `${prefix}-${productId}-${weight}`;
    };

    const fetchCart = async () => {
        const userId = currentUser?.id;

        // Path A: Guest Mode
        if (!userId) {
            try {
                const localData = localStorage.getItem('cart_guest');
                if (localData) {
                    const items = JSON.parse(localData);
                    const finalItems = Array.isArray(items) ? items : [];
                    syncState(finalItems);
                }
            } catch (err) {
                console.warn('Cart: Guest parse error:', err.message);
            }
            lastSessionId.current = null;
            return;
        }

        // Path B: Logged In Mode
        // Fetch only once per login session to prevent redundant waves or wiping
        if (lastSessionId.current === userId) return;

        try {
            console.log("Cart: Fetching user data from DB...");
            const { data, error } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;

            const fetchedItems = Array.isArray(data) ? data : [];
            console.log("Cart: Fetch successful, loaded", fetchedItems.length);
            syncState(fetchedItems);
            lastSessionId.current = userId;
        } catch (error) {
            console.error('Cart: DB Fetch Error (Sticky State active):', error.message);
            // STICKY DATA: We do NOT clear the state here.
            // This ensures the cart remains visible during cold starts or hiccups.
        }
    };

    // Load cart on start and when user changes
    useEffect(() => {
        fetchCart();
        setIsInitialLoad(false);

        // Sync guest cart across tabs using standard storage event
        const handleStorageChange = (e) => {
            if (e.key === 'cart_guest' && !currentUser) {
                try {
                    const nextItems = JSON.parse(e.newValue);
                    if (Array.isArray(nextItems)) {
                        cartRef.current = nextItems;
                        setCartItems(nextItems);
                    }
                } catch (err) {
                    console.error("Cart: Storage sync error:", err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
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
        console.log("Cart: Merging guest cart into user session...");
        for (const item of items) {
            // Recalculate the ID for the logged-in user context
            const cleanProductId = item.product_id || (item.id.includes('-') ? item.id.split('-').slice(1, -1).join('-') : item.id);
            const newId = generateItemId(cleanProductId, item.weight);
            await addToCart({ ...item, id: newId, product_id: cleanProductId }, item.quantity);
        }
        // No need to fetchCart here, addToCart handles sync/ref
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
                    image_url: product.image_url
                    // updated_at: new Date()
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
                .update({ quantity })
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
            console.log("Cart: Initiating order placement (status: pending)...");
            const { total } = getCartBreakdown();

            // 1. Create the base ORDER record first (Pending)
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: currentUser.id,
                    status: 'pending',
                    total_amount: total,
                    payment_method: paymentMethod,
                    payment_status: 'pending',
                    shipping_address: shippingDetails
                })
                .select()
                .single();

            if (orderError) throw orderError;
            console.log("Cart: Pending order created with ID:", orderData.id);
            return orderData.id;

        } catch (error) {
            console.error("Cart: placeOrder Error:", error.message);
            throw error;
        }
    };

    /**
     * Finalizes the order after a successful payment or for COD.
     * Moves items from cart_items to order_items and clears the cart.
     */
    const processPaymentSuccess = async (orderId) => {
        console.log("Cart: Processing successful payment for order:", orderId);

        try {
            // 1. Snapshot the current cart items
            const snapshotItems = [...cartRef.current];
            if (snapshotItems.length === 0) return;

            // 2. Insert into order_items
            const orderItemsData = snapshotItems.map(item => ({
                order_id: orderId,
                product_id: item.product_id || item.id.split('-').slice(0, -1).join('-'),
                quantity: item.quantity,
                price_at_time: item.price
                // weight: item.weight
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItemsData);

            if (itemsError) throw itemsError;

            // 3. Update Order status
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    payment_status: 'paid',
                    status: 'processing'
                    // updated_at: new Date()
                })
                .eq('id', orderId);

            if (updateError) throw updateError;

            // 4. Clear the cart (DB & Local)
            await clearCart();
            console.log("Cart: Order finalized successfully.");
            return true;
        } catch (error) {
            console.error("Cart: processPaymentSuccess failure:", error.message);
            throw error;
        }
    };

    const handleCODFinalize = async (orderId) => {
        try {
            console.log("Cart: Finalizing COD order:", orderId);
            // Snapshot current cart
            const snapshotItems = [...cartRef.current];

            // Insert into order_items
            const orderItemsData = snapshotItems.map(item => ({
                order_id: orderId,
                product_id: item.product_id || item.id.split('-').slice(0, -1).join('-'),
                quantity: item.quantity,
                price_at_time: item.price
                // weight: item.weight
            }));

            const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
            if (itemsError) throw itemsError;

            // Update order status for COD
            const { error: updateError } = await supabase
                .from('orders')
                .update({ status: 'processing' })
                .eq('id', orderId);

            if (updateError) throw updateError;

            await clearCart();
            return true;
        } catch (err) {
            console.error("COD Finalize Error:", err);
            throw err;
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
            placeOrder,
            processPaymentSuccess,
            handleCODFinalize,
            generateItemId
        }}>
            {children}
        </CartContext.Provider>
    );
};
