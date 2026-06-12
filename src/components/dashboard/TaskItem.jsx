import React from "react";
import { Bell, CheckCircle2, Clock, AlertTriangle, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const typeConfig = {
    client_updation: { icon: Bell, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/20" },
    order_start: { icon: Clock, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    order_end: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
};

const statusConfig = {
    done: { icon: CheckCircle2, label: "Done", bg: "bg-emerald-50/60 dark:bg-emerald-900/15", iconColor: "text-emerald-600 dark:text-emerald-400" },
    partial: { icon: MinusCircle, label: "Partial", bg: "bg-amber-50/60 dark:bg-amber-900/15", iconColor: "text-amber-600 dark:text-amber-400" },
    not_updated: { icon: null, label: "Not Updated", bg: "", iconColor: "" },
};

const statusOrder = ["not_updated", "partial", "done"];

export default function TaskItem({ task, onStatusChange, readOnly }) {
    const config = typeConfig[task.type] || typeConfig.client_updation;
    const Icon = config.icon;
    const isDone = task.status === "done";
    const isClientUpdation = task.type === "client_updation";
    const currentStatus = statusConfig[task.status] || statusConfig.not_updated;
    const StatusIcon = currentStatus.icon;

    return (
        <div className={cn(
            "flex items-center gap-4 p-4 rounded-xl border border-border transition-all duration-200",
            currentStatus.bg || "bg-card hover:shadow-md",
            isDone && "opacity-70"
        )}>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", config.bg)}>
                <Icon className={cn("w-5 h-5", config.color)} />
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", isDone && "text-muted-foreground")}>
                    {task.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{task.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {task.time && (
                    <span className="text-[11px] text-muted-foreground hidden sm:block">
                        {task.time}
                    </span>
                )}
                {isClientUpdation && !readOnly && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                                    task.status === "done" && "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50",
                                    task.status === "partial" && "border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50",
                                    task.status === "not_updated" && "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                )}
                            >
                                {StatusIcon && <StatusIcon className={cn("w-3.5 h-3.5", currentStatus.iconColor)} />}
                                {currentStatus.label}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                            {statusOrder.map((s) => {
                                const sc = statusConfig[s];
                                const SI = sc.icon;
                                return (
                                    <DropdownMenuItem
                                        key={s}
                                        onClick={() => onStatusChange(task, s)}
                                        className={cn("gap-2 text-xs cursor-pointer", task.status === s && "font-medium")}
                                    >
                                        {SI && <SI className={cn("w-3.5 h-3.5", sc.iconColor)} />}
                                        {sc.label}
                                        {task.status === s && <CheckCircle2 className="w-3 h-3 ml-auto text-primary" />}
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                {isClientUpdation && readOnly && (
                    <span className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border",
                        task.status === "done" && "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30",
                        task.status === "partial" && "border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30",
                        task.status === "not_updated" && "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                    )}>
                        {StatusIcon && <StatusIcon className={cn("w-3.5 h-3.5", currentStatus.iconColor)} />}
                        {currentStatus.label}
                    </span>
                )}
                {!isClientUpdation && (
                    <span className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-medium border",
                        task.status === "done" && "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30",
                        task.status === "not_updated" && "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                    )}>
                        {StatusIcon && <StatusIcon className={cn("w-3.5 h-3.5 inline mr-1", currentStatus.iconColor)} />}
                        {currentStatus.label}
                    </span>
                )}
            </div>
        </div>
    );
}