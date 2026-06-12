// Local Storage based database client for offline mode

const getOrders = () => {
    const data = localStorage.getItem("local_orders");
    return data ? JSON.parse(data) : [];
};

const setOrders = (orders) => {
    localStorage.setItem("local_orders", JSON.stringify(orders));
};

const getReminders = () => {
    const data = localStorage.getItem("local_photo_reminders");
    return data ? JSON.parse(data) : [];
};

const setReminders = (reminders) => {
    localStorage.setItem("local_photo_reminders", JSON.stringify(reminders));
};

export const localDb = {
    entities: {
        Order: {
            list: async () => {
                return getOrders();
            },
            create: async (orderData) => {
                const orders = getOrders();
                const newOrder = {
                    ...orderData,
                    id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                orders.push(newOrder);
                setOrders(orders);
                return newOrder;
            },
            delete: async (id) => {
                const orders = getOrders();
                const updated = orders.filter(o => o.id !== id);
                setOrders(updated);
                return { id };
            }
        },
        PhotoReminder: {
            list: async () => {
                return getReminders();
            },
            bulkCreate: async (remindersList) => {
                const reminders = getReminders();
                const newReminders = remindersList.map(r => ({
                    ...r,
                    id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));
                const updated = [...reminders, ...newReminders];
                setReminders(updated);
                return newReminders;
            },
            update: async (id, updateData) => {
                const reminders = getReminders();
                let updatedReminder = null;
                const updated = reminders.map(r => {
                    if (r.id === id) {
                        updatedReminder = {
                            ...r,
                            ...updateData,
                            updated_at: new Date().toISOString()
                        };
                        return updatedReminder;
                    }
                    return r;
                });
                setReminders(updated);
                return updatedReminder;
            },
            delete: async (id) => {
                const reminders = getReminders();
                const updated = reminders.filter(r => r.id !== id);
                setReminders(updated);
                return { id };
            }
        }
    }
};
