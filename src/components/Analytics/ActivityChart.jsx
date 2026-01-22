import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ActivityChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
                No activity recorded yet.
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full min-w-0" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                    <XAxis
                        dataKey="fullDate" // Use unique timestamp
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                        dy={10}
                        tickFormatter={(val) => {
                            const date = new Date(val);
                            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        }}
                    />
                    <YAxis
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                        itemStyle={{ color: '#ec4899' }}
                        labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '12px' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#ec4899"
                        fillOpacity={1}
                        fill="url(#colorScore)"
                        strokeWidth={3}
                        animationDuration={2000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
