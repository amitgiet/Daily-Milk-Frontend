import type { AppNotification } from "@/types/notification";

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 1,
    title: "Payment Received",
    message: "Rohan paid ₹450 for morning and evening milk collection.",
    createdAt: new Date().toISOString(),
    type: "success",
  },
  {
    id: 2,
    title: "Pending Payment",
    message: "Raja has ₹210 pending milk payment due this week.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    type: "warning",
  },
  {
    id: 3,
    title: "Milk Collection Added",
    message: "20L evening milk collected from Roshan today.",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    type: "info",
  },
  {
    id: 4,
    title: "Low Stock Alert",
    message: "Cattle feed stock is below minimum level. Please reorder soon.",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    type: "error",
  },
  {
    id: 5,
    title: "New Farmer Registered",
    message: "A new farmer was added to your dairy account.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    type: "info",
  },
];

export async function fetchNotifications() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_NOTIFICATIONS;
}
