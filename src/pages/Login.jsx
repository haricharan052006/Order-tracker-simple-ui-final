import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function Login() {
    const [name, setName] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (trimmedName) {
            localStorage.setItem("username", trimmedName);
            navigate("/");
        }
    };

    return (
        <AuthLayout
            icon={LogIn}
            title="Sign In"
            subtitle="Please enter your name to access the test tracker"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="username">Enter your name</Label>
                    <Input
                        id="username"
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-12 rounded-xl"
                        required
                        autoFocus
                    />
                </div>
                <Button type="submit" className="w-full h-12 font-medium rounded-xl">
                    Continue
                </Button>
            </form>
        </AuthLayout>
    );
}
