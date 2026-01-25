import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/UI/GlassCard';
import { NeonButton } from '../components/UI/NeonButton';
import { useAuth } from '../context/AuthContext';
import { shopService } from '../services/shopService';
import { ShoppingBag, Star, Shield, Layout, Sparkles, Loader, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

export default function Shop() {
    const { user, profile, refreshProfile } = useAuth();
    const [items, setItems] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // all, frame, title, utility

    useEffect(() => {
        if (user) loadShop();
    }, [user]);

    async function loadShop() {
        setLoading(true);
        try {
            const shopItems = await shopService.getShopItems();
            const userInv = await shopService.getUserInventory(user.id);
            setItems(shopItems);
            setInventory(userInv);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleBuy(item) {
        if (profile.xp < item.cost) {
            alert("Not enough XP!");
            return;
        }

        if (!confirm(`Buy ${item.name} for ${item.cost} XP?`)) return;

        setPurchasing(item.id);
        try {
            await shopService.purchaseItem(user.id, item);
            await refreshProfile(); // Update XP
            await loadShop(); // Update Inventory
            // alert('Purchased!');
        } catch (error) {
            console.error(error);
            alert("Purchase failed");
        } finally {
            setPurchasing(null);
        }
    }

    async function handleEquip(item) {
        try {
            await shopService.equipItem(user.id, item.id, item.type);
            await loadShop(); // Refresh equipped status
        } catch (error) {
            console.error(error);
        }
    }

    const filteredItems = activeTab === 'all' ? items : items.filter(i => i.type === activeTab);

    // Helpers to check inventory
    const getInventoryItem = (itemId) => inventory.find(i => i.item_id === itemId);
    const isOwned = (itemId) => !!getInventoryItem(itemId);
    const isEquipped = (itemId) => getInventoryItem(itemId)?.is_equipped;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            {/* Header / Balance */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-[rgb(var(--text-main))] flex items-center gap-3">
                        <ShoppingBag className="w-8 h-8 text-primary" />
                        XP Marketplace
                    </h1>
                    <p className="text-gray-400 mt-1">Spend your hard-earned XP on exclusive rewards.</p>
                </div>

                <GlassCard className="px-6 py-3 flex items-center gap-4 bg-primary/10 border-primary/20">
                    <div className="text-right">
                        <p className="text-xs text-primary-light uppercase font-bold tracking-wider">Your Balance</p>
                        <p className="text-2xl font-black text-white">{profile?.xp?.toLocaleString()} XP</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/50">
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                    </div>
                </GlassCard>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { id: 'all', label: 'All Items', icon: Star },
                    { id: 'frame', label: 'Frames', icon: Layout },
                    { id: 'title', label: 'Titles', icon: Shield },
                    { id: 'utility', label: 'Power-ups', icon: Sparkles },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                            activeTab === tab.id
                                ? "bg-white/10 text-white border border-white/20"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Shop Grid */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-4" /> Loading Shop...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(item => {
                        const owned = isOwned(item.id);
                        const equipped = isEquipped(item.id);
                        const canAfford = profile?.xp >= item.cost;
                        const isUtility = item.type === 'utility';

                        return (
                            <GlassCard key={item.id} className="p-6 relative overflow-hidden group flex flex-col h-full hover:border-primary/30 transition-all">
                                {/* Type Badge */}
                                <div className="absolute top-3 right-3 text-[10px] uppercase font-bold tracking-widest text-gray-500 bg-black/40 px-2 py-1 rounded">
                                    {item.type}
                                </div>

                                {/* Preview Area */}
                                <div className="flex-1 flex items-center justify-center py-8 mb-4 bg-black/20 rounded-xl relative">
                                    {item.type === 'frame' ? (
                                        <div className="relative w-20 h-20">
                                            <div className={cn("absolute inset-0 rounded-full", item.value)}></div>
                                            <div className="w-full h-full rounded-full overflow-hidden relative z-0 border-4 border-transparent bg-background-lighter flex items-center justify-center">
                                                {profile?.avatar_url ? (
                                                    <img src={profile.avatar_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-2xl font-bold text-gray-400">
                                                        {(profile?.username || 'U')[0].toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ) : item.type === 'title' ? (
                                        <span className="text-xl font-bold bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent">
                                            {item.value}
                                        </span>
                                    ) : (
                                        <Shield className="w-16 h-16 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="mb-6">
                                    <h3 className="font-bold text-white text-lg">{item.name}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                                </div>

                                {/* Actions */}
                                <div className="mt-auto">
                                    {owned && !isUtility ? (
                                        <button
                                            onClick={() => handleEquip(item)}
                                            disabled={equipped}
                                            className={cn(
                                                "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                                                equipped
                                                    ? "bg-green-500/10 text-green-400 cursor-default"
                                                    : "bg-white/10 hover:bg-white/20 text-white"
                                            )}
                                        >
                                            {equipped ? <><Check className="w-4 h-4" /> Equipped</> : "Equip"}
                                        </button>
                                    ) : (
                                        <NeonButton
                                            onClick={() => handleBuy(item)}
                                            disabled={purchasing === item.id || (!canAfford && !isUtility)}
                                            // Utility items can always be bought if affordable
                                            className={cn(
                                                "w-full justify-center",
                                                !canAfford && "opacity-50 grayscale cursor-not-allowed"
                                            )}
                                            variant={isUtility ? 'secondary' : 'primary'}
                                        >
                                            {purchasing === item.id ? (
                                                <Loader className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>Buy for {item.cost} XP</>
                                            )}
                                        </NeonButton>
                                    )}
                                </div>
                            </GlassCard>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
