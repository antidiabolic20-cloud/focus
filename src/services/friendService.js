import { supabase } from '../lib/supabase';

export const friendService = {
    // Send a friend request
    async sendRequest(friendId, userId) {
        const { data, error } = await supabase
            .from('friends')
            .insert({
                user_id: userId,
                friend_id: friendId,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Accept a friend request
    async acceptRequest(requestId) {
        const { data, error } = await supabase
            .from('friends')
            .update({ status: 'accepted' })
            .eq('id', requestId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Reject/Cancel/Remove friend
    async removeFriend(requestId) {
        const { error } = await supabase
            .from('friends')
            .delete()
            .eq('id', requestId);

        if (error) throw error;
        return true;
    },

    // Get all friends and requests
    async getFriendsAndRequests(userId) {
        const { data, error } = await supabase
            .from('friends')
            .select(`
                *,
                sender:profiles!user_id(*),
                receiver:profiles!friend_id(*)
            `)
            .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

        if (error) throw error;
        return data;
    },

    // Check availability (if already friends or requested)
    // Returns 'none', 'pending', 'accepted'
    async checkFriendshipStatus(otherUserId, myUserId) {
        const { data, error } = await supabase
            .from('friends')
            .select('status, user_id')
            .or(`and(user_id.eq.${myUserId},friend_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},friend_id.eq.${myUserId})`)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (!data) return 'none';

        // If I sent it and it's pending -> 'sent_pending'
        // If they sent it and it's pending -> 'received_pending'
        if (data.status === 'pending') {
            return data.user_id === myUserId ? 'sent_pending' : 'received_pending';
        }

        return 'accepted';
    }
};
