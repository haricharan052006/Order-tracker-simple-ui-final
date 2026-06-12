import React, { useMemo } from "react";
import { localDb } from "@/api/localDbClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, CheckCircle2, Calendar, Bell, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import StatCard from "@/components/shared/StatCard";
import { startOfWeek, endOfWeek, isWithinInterval, format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { Loader2 } from "lucide-react";

const COLORS = ["hsl(231, 48%, 48%)", "hsl(173, 58%, 39%)", "hsl(43, 74%, 49%)", "hsl(0, 72%, 51%)", "hsl(280, 65%, 60%)"];

export default function Analytics() {
    const { data: orders = [], isLoading: oLoading } = useQuery({
        queryKey: ["orders"],
        queryFn: () => localDb.entities.Order.list(),
    });

    const { data: reminders = [], isLoading: rLoading } = useQuery({
        queryKey: ["reminders"],
        queryFn: () => localDb.entities.PhotoReminder.list(),
    });

    const isLoading = oLoading || rLoading;

    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    const stats = useMemo(() => {
        const active = orders.filter((o) => o.status === "in_progress" || o.status === "pending").length;
        const completed = orders.filter((o) => o.status === "completed").length;
        const endingThisWeek = orders.filter((o) => {
            if (!o.end_date) return false;
            return isWithinInterval(new Date(o.end_date), { start: weekStart, end: weekEnd });
        }).length;
        const pendingUpdations = reminders.filter((r) => r.status === "not_updated").length;
        const partialUpdations = reminders.filter((r) => r.status === "partial").length;
        const doneUpdations = reminders.filter((r) => r.status === "done").length;

        return { active, completed, endingThisWeek, pendingUpdations, partialUpdations, doneUpdations };
    }, [orders, reminders]);

    // Status distribution for pie chart
    const statusData = useMemo(() => {
        const counts = { pending: 0, in_progress: 0, completed: 0, overdue: 0 };
        orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
        return Object.entries(counts)
            .filter(([, v]) => v > 0)
            .map(([name, value]) => ({ name: name.replace("_", " "), value }));
    }, [orders]);

    // Monthly activity
    const monthlyData = useMemo(() => {
        const sixMonthsAgo = subMonths(now, 5);
        const months = eachMonthOfInterval({ start: startOfMonth(sixMonthsAgo), end: endOfMonth(now) });
        return months.map((month) => {
            const mStart = startOfMonth(month);
            const mEnd = endOfMonth(month);
            const created = orders.filter((o) => o.created_date && isWithinInterval(new Date(o.created_date), { start: mStart, end: mEnd })).length;
            const updationsDone = reminders.filter((r) => r.completed_date && isWithinInterval(new Date(r.completed_date), { start: mStart, end: mEnd })).length;
            return {
                month: format(month, "MMM"),
                orders: created,
                updations: updationsDone,
            };
        });
    }, [orders, reminders]);

    // Test method distribution
    const methodData = useMemo(() => {
        const counts = {};
        orders.forEach((o) => {
            if (o.test_method) counts[o.test_method] = (counts[o.test_method] || 0) + 1;
        });
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6)
            .map(([name, value]) => ({ name, value }));
    }, [orders]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 space-y-8 max-w-6xl mx-auto">
            <div>
                <h1 className="text-3xl font-heading font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground text-sm mt-1">Testing activity insights</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard title="Active Orders" value={stats.active} icon={ClipboardList} color="bg-primary" />
                <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} color="bg-emerald-500" />
                <StatCard title="Ending This Week" value={stats.endingThisWeek} icon={Calendar} color="bg-amber-500" />
                <StatCard title="Pending Updations" value={stats.pendingUpdations} icon={Bell} color="bg-slate-500" />
                <StatCard title="Partial" value={stats.partialUpdations} icon={Clock} color="bg-amber-500" />
                <StatCard title="Done" value={stats.doneUpdations} icon={CheckCircle2} color="bg-emerald-500" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border border-border">
                    <CardHeader>
                        <CardTitle className="text-base font-heading">Monthly Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData}>
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                                    />
                                    <Bar dataKey="orders" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} name="Orders" />
                                    <Bar dataKey="updations" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} name="Updations" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-border">
                    <CardHeader>
                        <CardTitle className="text-base font-heading">Order Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center">
                            {statusData.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No data yet</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {statusData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center mt-2">
                            {statusData.map((entry, i) => (
                                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                    <span className="capitalize text-muted-foreground">{entry.name}: {entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-border lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base font-heading">Test Methods Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-56">
                            {methodData.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data yet</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={methodData} layout="vertical">
                                        <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={140} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                                        />
                                        <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 6, 6, 0]} name="Orders" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}