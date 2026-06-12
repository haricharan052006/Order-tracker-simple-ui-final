import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { localDb } from "@/api/localDbClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Calendar, Loader2 } from "lucide-react";
import OrderCard from "@/components/orders/OrderCard";
import { toast } from "sonner";
import { differenceInDays, isSameDay, isWithinInterval, startOfDay, endOfDay } from "date-fns";

export default function Orders() {
    const [tab, setTab] = useState("active");
    const [nameSearch, setNameSearch] = useState("");
    const [dateSearch, setDateSearch] = useState("");
    const queryClient = useQueryClient();

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ["orders"],
        queryFn: () => localDb.entities.Order.list(),
    });

    const { data: reminders = [] } = useQuery({
        queryKey: ["reminders"],
        queryFn: () => localDb.entities.PhotoReminder.list(),
    });

    const deleteOrder = useMutation({
        mutationFn: async (orderId) => {
            const orderReminders = reminders.filter((r) => r.order_id === orderId);
            for (const r of orderReminders) {
                await localDb.entities.PhotoReminder.delete(r.id);
            }
            await localDb.entities.Order.delete(orderId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            queryClient.invalidateQueries({ queryKey: ["reminders"] });
            toast.success("Order deleted");
        },
    });

    const getReminderCount = (orderId) => reminders.filter((r) => r.order_id === orderId).length;

    const filteredOrders = useMemo(() => {
        let list = orders;

        // Filter by tab
        if (tab === "active") {
            list = list.filter((o) => o.status === "in_progress" || o.status === "pending");
        } else {
            list = list.filter((o) => {
                if (o.status !== "completed") return false;
                const daysSinceEnd = differenceInDays(new Date(), new Date(o.end_date));
                return daysSinceEnd <= 30;
            });
        }

        // Search by order name/number
        if (nameSearch.trim()) {
            const q = nameSearch.toLowerCase();
            list = list.filter(
                (o) =>
                    o.order_name?.toLowerCase().includes(q) ||
                    o.order_number?.toLowerCase().includes(q) ||
                    o.client_name?.toLowerCase().includes(q)
            );
        }

        // Search by date — show orders with start_date, end_date, or a client updation on that day
        if (dateSearch) {
            const targetDate = startOfDay(new Date(dateSearch));
            const targetEnd = endOfDay(new Date(dateSearch));
            list = list.filter((o) => {
                if (o.start_date && isSameDay(new Date(o.start_date), targetDate)) return true;
                if (o.end_date && isSameDay(new Date(o.end_date), targetDate)) return true;
                const orderReminders = reminders.filter((r) => r.order_id === o.id);
                return orderReminders.some((r) =>
                    isWithinInterval(new Date(r.due_date), { start: targetDate, end: targetEnd })
                );
            });
        }

        return list;
    }, [orders, tab, nameSearch, dateSearch, reminders]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold tracking-tight">Orders</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {orders.length} total orders
                    </p>
                </div>
                <Link to="/orders/new">
                    <Button className="gap-2 rounded-xl shadow-md shadow-primary/20">
                        <Plus className="w-4 h-4" />
                        Add Order
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <Tabs value={tab} onValueChange={setTab} className="shrink-0">
                    <TabsList className="rounded-xl">
                        <TabsTrigger value="active" className="rounded-lg text-xs px-5">Active</TabsTrigger>
                        <TabsTrigger value="completed" className="rounded-lg text-xs px-5">Completed</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="TOCR number..."
                            value={nameSearch}
                            onChange={(e) => setNameSearch(e.target.value)}
                            className="pl-9 rounded-xl"
                        />
                    </div>
                    <div className="relative w-full sm:w-44">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="date"
                            value={dateSearch}
                            onChange={(e) => setDateSearch(e.target.value)}
                            className="pl-9 rounded-xl"
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {filteredOrders.length === 0 ? (
                    <div className="col-span-full text-center py-16 text-muted-foreground">
                        <p className="text-sm">
                            {tab === "active" ? "No active orders. Create your first order!" : "No completed orders in the last 30 days."}
                        </p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onDelete={(id) => deleteOrder.mutate(id)}
                            updationCount={getReminderCount(order.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}