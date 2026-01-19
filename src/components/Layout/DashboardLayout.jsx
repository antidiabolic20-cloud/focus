import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet } from 'react-router-dom';

export function DashboardLayout() {
    return (
        <div className="min-h-screen bg-background text-white selection:bg-primary/30">
            <Sidebar />
            <Topbar />

            {/* Main Content Area */}
            <main className="pl-64 pt-20 min-h-screen">
                <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
