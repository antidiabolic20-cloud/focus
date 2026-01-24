import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setStreak(0);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    async function fetchProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (!error && data) {
                setProfile(data);
                checkStreak(userId);
            } else if (error && error.code === 'PGRST116') {
                // Profile doesn't exist yet (might happen on first login if trigger fails or is slow)
                console.log("Profile not found, waiting for creation...");
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    }

    async function checkStreak(userId) {
        try {
            // Get current streak data
            const { data: streakData, error } = await supabase
                .from('streaks')
                .select('*')
                .eq('user_id', userId)
                .single();

            const today = new Date();
            const toDateString = (date) => date.toISOString().split('T')[0];

            if (error && error.code === 'PGRST116') {
                // Initialize streak if missing
                await supabase.from('streaks').upsert({ user_id: userId, current_streak: 1, last_login: today.toISOString() });
                setStreak(1);
                return;
            }

            if (!streakData) return;
            setStreak(streakData.current_streak);

            const lastLogin = new Date(streakData.last_login);

            if (toDateString(lastLogin) === toDateString(today)) {
                return; // Already logged in today
            }

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const isConsecutive = (toDateString(lastLogin) === toDateString(yesterday));

            if (isConsecutive) {
                // Increment streak
                const newStreak = streakData.current_streak + 1;
                await supabase.from('streaks').update({
                    current_streak: newStreak,
                    last_login: today.toISOString()
                }).eq('user_id', userId);
                setStreak(newStreak);
            } else {
                // MISSED A DAY - CHECK FOR FREEZE
                if (streakData.freeze_items > 0) {
                    // Consume Freeze
                    await supabase.from('streaks').update({
                        freeze_items: streakData.freeze_items - 1,
                        last_login: today.toISOString() // Mark as active today to maintain chain for tomorrow
                        // Don't increment streak, but don't reset. Just update date.
                    }).eq('user_id', userId);
                    console.log("Streak Saved by Freeze!");
                    // Toast notification could go here
                } else {
                    // Reset streak
                    await supabase.from('streaks').update({
                        current_streak: 1,
                        last_login: today.toISOString()
                    }).eq('user_id', userId);
                    setStreak(1);
                }
            }
        } catch (err) {
            console.error("Error checking streak:", err);
        }
    }

    const value = {
        signUp: (data) => supabase.auth.signUp({
            ...data,
            options: {
                emailRedirectTo: window.location.origin,
            }
        }),
        signIn: (data) => supabase.auth.signInWithPassword(data),
        signOut: () => supabase.auth.signOut(),
        refreshProfile: () => user && fetchProfile(user.id),
        user,
        profile,
        streak,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
