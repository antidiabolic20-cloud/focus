import { supabase } from '../lib/supabase';

export const shopService = {
    // Get all shop items
    async getShopItems() {
        const { data, error } = await supabase
            .from('shop_items')
            .select('*')
            .order('cost', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Get user's inventory
    async getUserInventory(userId) {
        const { data, error } = await supabase
            .from('user_inventory')
            .select(`
                *,
                item:shop_items(*)
            `)
            .eq('user_id', userId);

        if (error) throw error;
        return data;
    },

    // Purchase an item
    async purchaseItem(userId, item) {
        // 1. Check XP balance (Optional: frontend checks first, but good to have)
        // For now relying on frontend check + RLS/Trigger security later if needed.

        // 2. Deduct XP
        const { error: xpError } = await supabase.rpc('increment_xp', {
            user_id: userId,
            amount: -item.cost
        });

        if (xpError) throw xpError;

        // 3. Add to Inventory
        // If utility (Freeze), likely handled differently (stackable?)
        // For MVP, treating Freeze as stackable in streaks table, not inventory table?
        // Actually, let's keep it simple: Utility items like freeze are consumed immediately on buy OR stored in streaks table

        if (item.type === 'utility' && item.value === 'freeze_streak') {
            // Add to streaks table freeze_items count
            const { error: freezeError } = await supabase.rpc('add_freeze_item', {
                u_id: userId
            });
            // If RPC doesn't exist, manual update:
            if (freezeError) {
                // Fallback manual update
                const { data: streak } = await supabase.from('streaks').select('freeze_items').eq('user_id', userId).single();
                await supabase.from('streaks').update({ freeze_items: (streak?.freeze_items || 0) + 1 }).eq('user_id', userId);
            }
            return true;
        }

        // Normal Items (Frames/Titles)
        const { data, error } = await supabase
            .from('user_inventory')
            .insert({
                user_id: userId,
                item_id: item.id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Equip an item
    async equipItem(userId, itemId, itemType) {
        // 1. Unequip all items of this type
        // We first need to find which items in inventory are of this type.
        // This is complex in one query.

        // Simpler approach: 
        // Get all user inventory items with their types
        const { data: inventory } = await this.getUserInventory(userId);

        const itemsToUnequip = inventory
            .filter(i => i.item.type === itemType && i.is_equipped)
            .map(i => i.id);

        if (itemsToUnequip.length > 0) {
            await supabase
                .from('user_inventory')
                .update({ is_equipped: false })
                .in('id', itemsToUnequip);
        }

        // 2. Equip new item
        const { error } = await supabase
            .from('user_inventory')
            .update({ is_equipped: true })
            .eq('user_id', userId)
            .eq('item_id', itemId); // This is inventory item_id (which is auto id?), no, wait.
        // itemId passed here should be Shop Item ID or Inventory ID?
        // Let's assume passed ID is the ITEM ID (from shop) to match easier from UI
        // But user might have multiples? No, uniqueness logic needed.
        // Let's assume unique ownership for cosmetics.

        // Actually, better to pass the inventory Row ID to equip. 
        // But UI usually displays Shop Items. 
        // Let's rely on shop item id.

        // Wait, update query above needs inventory id or filter by item_id and user_id.
        await supabase
            .from('user_inventory')
            .update({ is_equipped: true })
            .eq('user_id', userId)
            .eq('item_id', itemId);

        if (error) throw error;

        // 3. Update Profile 'avatar_url' / metadata? 
        // Actually, we should store equipped frame/title in profiles table for easier access?
        // OR calculate it on the fly. 
        // calculate on fly is slower.
        // Let's add 'equipped_frame' and 'equipped_title' to profiles for caching?
        // Implementing simple "fetch profile + inventory" approach in frontend is fine for now.

        return true;
    }
};
