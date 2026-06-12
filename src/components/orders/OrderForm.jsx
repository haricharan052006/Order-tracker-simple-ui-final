import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { localDb } from "@/api/localDbClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

const testMethods = [
    "Thermal Cycling",
    "Vibration Testing",
    "Salt Spray Testing",
    "UV Exposure",
    "Humidity Testing",
    "Accelerated Aging",
    "Mechanical Stress",
    "Chemical Resistance",
    "Pressure Testing",
    "Other",
];

export default function OrderForm() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [useCustomMethod, setUseCustomMethod] = useState(false);
    const [form, setForm] = useState({
        order_name: "",
        client_name: "",
        test_method: "",
        description: "",
        start_date: "",
        end_date: "",
        photo_interval_hours: "",
        test_method_custom: "",
    });
    const [errors, setErrors] = useState({});

    const validate = () => {
        const errs = {};
        if (!form.order_name.trim()) errs.order_name = "Required";
        if (!form.client_name.trim()) errs.client_name = "Required";
        if (!form.test_method) errs.test_method = "Required";
        if (form.test_method === "Custom" && !form.test_method_custom.trim()) errs.test_method_custom = "Required";
        if (!form.description.trim()) errs.description = "Required";
        if (!form.start_date) errs.start_date = "Required";
        if (!form.end_date) errs.end_date = "Required";
        if (!form.photo_interval_hours) errs.photo_interval_hours = "Required";
        if (form.start_date && form.end_date && new Date(form.end_date) <= new Date(form.start_date)) {
            errs.end_date = "End date must be after start date";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const generateReminders = (order) => {
        const reminders = [];
        const start = new Date(order.start_date);
        const end = new Date(order.end_date);
        const intervalMs = order.photo_interval_hours * 60 * 60 * 1000;
        let hourMark = order.photo_interval_hours;
        let dueDate = new Date(start.getTime() + intervalMs);

        while (dueDate <= end) {
            reminders.push({
                order_id: order.id,
                order_name: order.order_name,
                client_name: order.client_name,
                hour_mark: hourMark,
                due_date: dueDate.toISOString(),
                status: "not_updated",
            });
            hourMark += order.photo_interval_hours;
            dueDate = new Date(start.getTime() + hourMark * 60 * 60 * 1000);
        }
        return reminders;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        const orderNumber = `ML-${Date.now().toString(36).toUpperCase()}`;
        const orderData = {
            ...form,
            order_number: orderNumber,
            test_method: form.test_method === "Custom" ? form.test_method_custom : form.test_method,
            photo_interval_hours: Number(form.photo_interval_hours),
            status: "in_progress",
        };

        const created = await localDb.entities.Order.create(orderData);

        const reminders = generateReminders({ ...orderData, id: created.id });
        if (reminders.length > 0) {
            await localDb.entities.PhotoReminder.bulkCreate(reminders);
        }

        toast.success(`${form.order_name} created with ${reminders.length} client updation reminders.`);
        setSaving(false);
        navigate("/orders");
    };

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    return (
        <div className="p-6 lg:p-10 max-w-3xl mx-auto">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <Card className="border border-border shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-2xl font-heading font-bold">New Test Order</CardTitle>
                    <p className="text-sm text-muted-foreground">All fields are required to create an order.</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label>Order Name / Number</Label>
                                <Input
                                    placeholder="e.g. Thermal Cycle Test - Batch A"
                                    value={form.order_name}
                                    onChange={(e) => updateField("order_name", e.target.value)}
                                    className={errors.order_name ? "border-destructive" : ""}
                                />
                                {errors.order_name && <p className="text-xs text-destructive">{errors.order_name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Client Name</Label>
                                <Input
                                    placeholder="e.g. Kia Motors"
                                    value={form.client_name}
                                    onChange={(e) => updateField("client_name", e.target.value)}
                                    className={errors.client_name ? "border-destructive" : ""}
                                />
                                {errors.client_name && <p className="text-xs text-destructive">{errors.client_name}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Test Method</Label>
                            <Select
                                value={useCustomMethod ? "Custom" : form.test_method}
                                onValueChange={(v) => {
                                    if (v === "Custom") {
                                        setUseCustomMethod(true);
                                        updateField("test_method", "Custom");
                                    } else {
                                        setUseCustomMethod(false);
                                        updateField("test_method", v);
                                        updateField("test_method_custom", "");
                                    }
                                }}
                            >
                                <SelectTrigger className={errors.test_method ? "border-destructive" : ""}>
                                    <SelectValue placeholder="Select a test method" />
                                </SelectTrigger>
                                <SelectContent>
                                    {testMethods.map((m) => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                    <SelectItem value="Custom">Custom...</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.test_method && <p className="text-xs text-destructive">{errors.test_method}</p>}
                            {useCustomMethod && (
                                <Input
                                    placeholder="Enter custom test method..."
                                    value={form.test_method_custom}
                                    onChange={(e) => updateField("test_method_custom", e.target.value)}
                                    className={errors.test_method_custom ? "border-destructive mt-2" : "mt-2"}
                                />
                            )}
                            {errors.test_method_custom && <p className="text-xs text-destructive">{errors.test_method_custom}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                placeholder="Describe the test requirements, sample details, and any special instructions..."
                                value={form.description}
                                onChange={(e) => updateField("description", e.target.value)}
                                className={`min-h-[100px] ${errors.description ? "border-destructive" : ""}`}
                            />
                            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={form.start_date}
                                    onChange={(e) => updateField("start_date", e.target.value)}
                                    className={errors.start_date ? "border-destructive" : ""}
                                />
                                {errors.start_date && <p className="text-xs text-destructive">{errors.start_date}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={form.end_date}
                                    onChange={(e) => updateField("end_date", e.target.value)}
                                    className={errors.end_date ? "border-destructive" : ""}
                                />
                                {errors.end_date && <p className="text-xs text-destructive">{errors.end_date}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Client Updation Interval (hours)</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="e.g. 24, 100, 500"
                                value={form.photo_interval_hours}
                                onChange={(e) => updateField("photo_interval_hours", e.target.value)}
                                className={errors.photo_interval_hours ? "border-destructive" : ""}
                            />
                            {errors.photo_interval_hours && <p className="text-xs text-destructive">{errors.photo_interval_hours}</p>}
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 gap-2" disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? "Creating..." : "Create Order"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}