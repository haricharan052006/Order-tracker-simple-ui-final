import React, { useState, useEffect } from "react";
import { localDb } from "@/api/localDbClient";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Share2, Download, Sun, Moon, AlertTriangle, Loader2 } from "lucide-react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function SettingsPage() {
    const [darkMode, setDarkMode] = useState(false);
    const [showSecondConfirm, setShowSecondConfirm] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        const isDark = document.documentElement.classList.contains("dark");
        setDarkMode(isDark);
    }, []);

    const toggleTheme = (checked) => {
        setDarkMode(checked);
        if (checked) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: "Microlab Test Tracker", url: window.location.origin });
        } else {
            navigator.clipboard.writeText(window.location.origin);
            toast.success("Link copied to clipboard");
        }
    };

    const handleExport = async () => {
        setExporting(true);
        const orders = await localDb.entities.Order.list();
        const reminders = await localDb.entities.PhotoReminder.list();

        // Build CSV
        const headers = ["Order Number", "Order Name", "Client", "Test Method", "Description", "Start Date", "End Date", "Interval (hrs)", "Status"];
        const rows = orders.map((o) => [
            o.order_number, o.order_name, o.client_name, o.test_method,
            `"${(o.description || "").replace(/"/g, '""')}"`,
            o.start_date, o.end_date, o.photo_interval_hours, o.status,
        ]);

        let csv = headers.join(",") + "\n" + rows.map((r) => r.join(",")).join("\n");

        csv += "\n\nPhoto Reminders\n";
        csv += "Order Name,Client,Hour Mark,Due Date,Status,Completed Date\n";
        reminders.forEach((r) => {
            csv += `${r.order_name},${r.client_name},${r.hour_mark},${r.due_date},${r.status},${r.completed_date || ""}\n`;
        });

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `microlab_export_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setExporting(false);
        toast.success("Data exported successfully");
    };

    const handleReset = async () => {
        setResetting(true);
        const orders = await localDb.entities.Order.list();
        const reminders = await localDb.entities.PhotoReminder.list();

        for (const r of reminders) {
            await localDb.entities.PhotoReminder.delete(r.id);
        }
        for (const o of orders) {
            await localDb.entities.Order.delete(o.id);
        }

        queryClient.invalidateQueries();
        setResetting(false);
        setShowSecondConfirm(false);
        toast.success("Application reset complete. All data has been deleted.");
    };

    return (
        <div className="p-6 lg:p-10 space-y-8 max-w-3xl mx-auto">
            <div>
                <h1 className="text-3xl font-heading font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground text-sm mt-1">Manage app preferences</p>
            </div>

            <Card className="border border-border">
                <CardHeader>
                    <CardTitle className="text-base font-heading">App Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Share */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <Share2 className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Share App</p>
                                <p className="text-xs text-muted-foreground">Share this app with your team</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={handleShare}>Share</Button>
                    </div>

                    <Separator />

                    {/* Export */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                <Download className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Export Data</p>
                                <p className="text-xs text-muted-foreground">Download all data as CSV</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={handleExport} disabled={exporting}>
                            {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            Export
                        </Button>
                    </div>

                    <Separator />

                    {/* Theme */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                                {darkMode ? <Moon className="w-5 h-5 text-amber-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
                            </div>
                            <div>
                                <p className="text-sm font-medium">Dark Mode</p>
                                <p className="text-xs text-muted-foreground">{darkMode ? "Dark theme active" : "Light theme active"}</p>
                            </div>
                        </div>
                        <Switch checked={darkMode} onCheckedChange={toggleTheme} />
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border border-destructive/30">
                <CardHeader>
                    <CardTitle className="text-base font-heading text-destructive flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Danger Zone
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Reset Application</p>
                            <p className="text-xs text-muted-foreground">Delete all orders and reminders permanently</p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="rounded-xl">Reset</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Reset Application?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will delete all orders and photo reminders. This is the first confirmation step.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={() => setShowSecondConfirm(true)}
                                    >
                                        Continue
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog open={showSecondConfirm} onOpenChange={setShowSecondConfirm}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-destructive">⚠️ Final Confirmation</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. Are you absolutely sure you want to delete all data?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={resetting}>No, keep my data</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                                        onClick={handleReset}
                                        disabled={resetting}
                                    >
                                        {resetting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Yes, delete everything
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>

            <div className="text-center text-xs text-muted-foreground pt-4">
                Designed by Hari Charan
            </div>
        </div>
    );
}