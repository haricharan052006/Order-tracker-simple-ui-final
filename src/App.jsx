import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Orders from '@/pages/Orders';
import NewOrder from '@/pages/NewOrder';
import Analytics from '@/pages/Analytics';
import SettingsPage from '@/pages/SettingsPage';
import { useEffect } from 'react';

// Initialize theme from localStorage
function ThemeInit() {
    useEffect(() => {
        const saved = localStorage.getItem("theme");
        if (saved === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, []);
    return null;
}

const AuthenticatedApp = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/orders/new" element={<NewOrder />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>
            </Route>
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
};

function App() {
    return (
        <QueryClientProvider client={queryClientInstance}>
            <ThemeInit />
            <Router>
                <AuthenticatedApp />
            </Router>
            <Toaster />
        </QueryClientProvider>
    )
}

export default App