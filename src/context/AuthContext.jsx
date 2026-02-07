import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import emailjs from '@emailjs/browser';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'admin' or 'customer'
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role, full_name, email')
                .eq('id', userId)
                .single();

            if (data && !error) {
                setUserRole(data.role);
                // Return data if needed
                return data;
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
        setUserRole('customer'); // Default to customer on error
        return null;
    };

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                // Get initial session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (mounted) {
                    if (session?.user) {
                        setCurrentUser(session.user);
                        // Fetch profile in parallel, don't block main render if possible, 
                        // or block but with timeout? 
                        // Current logic: await fetchProfile. 
                        // If profile fetch fails, we still want to be logged in.
                        await fetchProfile(session.user.id);
                    }
                }
            } catch (err) {
                console.error("Auth initialization error:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth State Change:", event, session?.user?.email);
            if (mounted) {
                if (session?.user) {
                    setCurrentUser(session.user);
                    // Only fetch profile if we don't have it or user changed
                    await fetchProfile(session.user.id);
                } else {
                    setCurrentUser(null);
                    setUserRole(null);
                }
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const sendLoginSuccessEmail = (name, email) => {
        // Placeholder for EmailJS integration
        // This function will be called on successful login/signup
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_LOGIN;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey) {
            emailjs.send(serviceId, templateId, {
                to_name: name || 'User',
                to_email: email,
                message: 'You have successfully logged in to Santi Rice Mill.'
            }, publicKey)
                .then(() => {
                    console.log('Login email sent successfully!');
                }, (error) => {
                    console.error('Failed to send login email:', error);
                });
        } else {
            console.log("EmailJS keys missing or incomplete - Skipping email send");
        }
    };

    const signup = async (email, password, name) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                },
            },
        });
        if (error) throw error;
        // User profile creation is handled by Supabase Trigger
        if (data.user) {
            // Optionally send welcome email here too
            sendLoginSuccessEmail(name, email);
        }
        return data;
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;

        // Fetch profile to get name for email
        if (data.user) {
            const profile = await fetchProfile(data.user.id);
            sendLoginSuccessEmail(profile?.full_name || email.split('@')[0], email);
        }
        return data;
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUserRole(null);
        setCurrentUser(null);
    };

    const resetPassword = async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
    };

    const updatePassword = async (newPassword) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
    };

    const value = {
        currentUser,
        userRole, // Expose role
        signup,
        login,
        logout,
        resetPassword,
        updatePassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
