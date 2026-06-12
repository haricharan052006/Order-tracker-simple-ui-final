import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard, ClipboardList, BarChart3, Settings,
    Plus, Menu, FlaskConical, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Orders", path: "/orders", icon: ClipboardList },
    { label: "Analytics", path: "/analytics", icon: BarChart3 },
    { label: "Settings", path: "/settings", icon: Settings },
];

function NavContent({ currentPath, onNavigate }) {
    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border">
                <Link to="/" className="flex items-center gap-3" onClick={onNavigate}>
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                        <FlaskConical className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="font-heading font-bold text-lg tracking-tight">Microlab</h1>
                        <p className="text-[11px] text-muted-foreground font-medium tracking-wider uppercase">Test Tracker</p>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = currentPath === item.path ||
                        (item.path !== "/" && currentPath.startsWith(item.path));
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onNavigate}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                        >
                            <item.icon className="w-[18px] h-[18px]" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border space-y-2">
                <Link to="/orders/new" onClick={onNavigate}>
                    <Button className="w-full gap-2 rounded-xl h-11 shadow-md shadow-primary/20">
                        <Plus className="w-4 h-4" />
                        Add Order
                    </Button>
                </Link>
                <Button
                    variant="ghost"
                    onClick={() => {
                        localStorage.clear();
                        window.location.href = "/login";
                    }}
                    className="w-full gap-3 rounded-xl h-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10 justify-start px-4 transition-all duration-200"
                >
                    <LogOut className="w-[18px] h-[18px]" />
                    Logout
                </Button>
            </div>
        </div>
    );
}

export default function AppLayout() {
    const location = useLocation();
    const [open, setOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card fixed inset-y-0 left-0 z-30">
                <NavContent currentPath={location.pathname} onNavigate={() => { }} />
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
                <div className="flex items-center justify-between px-4 h-16">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <FlaskConical className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-heading font-bold text-base">Microlab</span>
                    </Link>
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0">
                            <NavContent currentPath={location.pathname} onNavigate={() => setOpen(false)} />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64">
                <div className="pt-16 lg:pt-0 min-h-screen">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}