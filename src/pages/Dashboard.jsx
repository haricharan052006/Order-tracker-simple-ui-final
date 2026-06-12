import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { localDb } from "@/api/localDbClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ClipboardList, CheckCircle2, AlertTriangle, Clock, Loader2 } from "lucide-react";
import { startOfDay, endOfDay, addDays, subDays, isWithinInterval, format, isSameDay } from "date-fns";
import StatCard from "@/components/shared/StatCard";
import TaskItem from "@/components/dashboard/TaskItem";
import { toast } from "sonner";

const STATUS_LABELS = { not_updated: "Not Updated", partial: "Partial", done: "Done" };

export default function Dashboard() {
    const [view, setView] = useState("today");
    const queryClient = useQueryClient();

    const { data: orders = [], isLoading: ordersLoading } = useQuery({
        queryKey: ["orders"],
        queryFn: () => localDb.entities.Order.list(),
    });

    const { data: reminders = [], isLoading: remindersLoading } = useQuery({
        queryKey: ["reminders"],
        queryFn: () => localDb.entities.PhotoReminder.list(),
    });

    const updateReminderStatus = useMutation({
        mutationFn: ({ id, status }) =>
            localDb.entities.PhotoReminder.update(id, {
                status,
                completed_date: status === "done" ? new Date().toISOString() : null,
            }),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ["reminders"] });
            toast.success(`Client updation marked as ${STATUS_LABELS[vars.status]}`);
        },
    });

    const isLoading = ordersLoading || remindersLoading;

    const now = new Date();
    const today = startOfDay(now);
    const yesterday = subDays(today, 1);
    const tomorrow = addDays(today, 1);

    const generateTasks = (targetDate) => {
        const tasks = [];
        const dayStart = startOfDay(targetDate);
        const dayEnd = endOfDay(targetDate);

        // Orders starting on this day
        orders.forEach((order) => {
            if (order.start_date && isSameDay(new Date(order.start_date), targetDate)) {
                tasks.push({
                    id: `start-${order.id}`,
                    type: "order_start",
                    title: `New order starts: ${order.order_name}`,
                    subtitle: `${order.client_name} · ${order.test_method}`,
                    time: "Start",
                    status: "done",
                });
            }
        });

        // Orders ending on this day
        orders.forEach((order) => {
            if (order.end_date && isSameDay(new Date(order.end_date), targetDate)) {
                tasks.push({
                    id: `end-${order.id}`,
                    type: "order_end",
                    title: `Test ends: ${order.order_name}`,
                    subtitle: `${order.client_name} · Review final results`,
                    time: "End",
                    status: order.status === "completed" ? "done" : "not_updated",
                });
            }
        });

        // Client updation reminders due on this day
        reminders.forEach((reminder) => {
            const dueDate = new Date(reminder.due_date);
            if (isWithinInterval(dueDate, { start: dayStart, end: dayEnd })) {
                tasks.push({
                    id: `updation-${reminder.id}`,
                    reminderId: reminder.id,
                    type: "client_updation",
                    title: `Client updation due for ${reminder.order_name}`,
                    subtitle: `${reminder.client_name} · ${reminder.hour_mark}h updation`,
                    time: format(dueDate, "h:mm a"),
                    status: reminder.status,
                });
            }
        });

        return tasks.sort((a, b) => {
            if (a.status === "done" && b.status !== "done") return 1;
            if (a.status === "not_updated" && b.status !== "not_updated") return -1;
            return 0;
        });
    };

    const viewDate = view === "today" ? today : view === "yesterday" ? yesterday : tomorrow;
    const tasks = useMemo(() => generateTasks(viewDate), [view, orders, reminders]);

    // Dynamic stats for selected date view
    const pendingCount = tasks.filter((t) => t.status === "not_updated").length;
    const completedCount = tasks.filter((t) => t.status === "done").length;
    const partialCount = tasks.filter((t) => t.status === "partial").length;
    const overdueCount = tasks.filter((t) => {
        if (t.status === "done") return false;
        if (!t.reminderId) return false;
        const reminder = reminders.find((r) => r.id === t.reminderId);
        return reminder && new Date(reminder.due_date) < now;
    }).length;

    const handleStatusChange = (task, newStatus) => {
        if (task.reminderId) {
            updateReminderStatus.mutate({ id: task.reminderId, status: newStatus });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const username = localStorage.getItem("username") || "Guest";

    return (
        <div className="p-6 lg:p-10 space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold tracking-tight">Welcome, {username}</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {format(now, "EEEE, MMMM d, yyyy")}
                    </p>
                </div>
                <Link to="/orders/new">
                    <Button className="gap-2 rounded-xl shadow-md shadow-primary/20">
                        <Plus className="w-4 h-4" />
                        Add Order
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Orders" value={orders.length} icon={ClipboardList} color="bg-primary" />
                <StatCard title="Pending" value={pendingCount} icon={Clock} color="bg-slate-500" subtitle={view === "today" ? "Today" : view === "yesterday" ? "Yesterday" : "Tomorrow"} />
                <StatCard title="Completed" value={completedCount} icon={CheckCircle2} color="bg-emerald-500" subtitle={view === "today" ? "Today" : view === "yesterday" ? "Yesterday" : "Tomorrow"} />
                <StatCard title="Overdue" value={overdueCount} icon={AlertTriangle} color="bg-red-500" subtitle={view === "today" ? "Today" : view === "yesterday" ? "Yesterday" : "Tomorrow"} />
            </div>

            {/* Daily Tasks */}
            <Card className="border border-border p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-xl font-heading font-semibold">Daily Activities</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {tasks.length} tasks · {completedCount} done · {partialCount} partial · {pendingCount} pending
                        </p>
                    </div>
                    <Tabs value={view} onValueChange={setView}>
                        <TabsList className="rounded-xl">
                            <TabsTrigger value="yesterday" className="rounded-lg text-xs px-4">Yesterday</TabsTrigger>
                            <TabsTrigger value="today" className="rounded-lg text-xs px-4">Today</TabsTrigger>
                            <TabsTrigger value="tomorrow" className="rounded-lg text-xs px-4">Tomorrow</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="space-y-3">
                    {tasks.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-sm">No activities for {view === "today" ? "today" : view === "yesterday" ? "yesterday" : "tomorrow"}.</p>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onStatusChange={handleStatusChange}
                                readOnly={view === "tomorrow"}
                            />
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}