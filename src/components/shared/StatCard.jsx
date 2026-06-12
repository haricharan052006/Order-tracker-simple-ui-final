import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, icon: Icon, color, subtitle = undefined }) {
    return (
        <Card className="p-5 border border-border hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                    <p className="text-3xl font-bold font-heading tracking-tight">{value}</p>
                    {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                </div>
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", color)}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
        </Card>
    );
}