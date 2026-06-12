import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { Calendar, Clock, Bell, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function OrderCard({ order, onDelete, updationCount }) {
    return (
        <Card className="p-5 border border-border hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start justify-between mb-3">
                <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono text-muted-foreground">{order.order_number}</span>
                        <StatusBadge status={order.status} />
                    </div>
                    <h3 className="font-heading font-semibold text-base truncate">{order.order_name}</h3>
                    <p className="text-sm text-muted-foreground">{order.client_name}</p>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the order "{order.order_name}" and all associated client updation reminders.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>No, keep it</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(order.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Yes, delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{order.description}</p>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {order.start_date ? format(new Date(order.start_date), "MMM d") : "—"} — {order.end_date ? format(new Date(order.end_date), "MMM d, yyyy") : "—"}
                </span>
                <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {order.test_method}
                </span>
                <span className="flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" />
                    Every {order.photo_interval_hours}h
                    {updationCount !== undefined && ` · ${updationCount} updations`}
                </span>
            </div>
        </Card>
    );
}