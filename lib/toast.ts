"use client";

import { toast } from "@/components/ui/toast";

export function showSuccess(title: string, description?: string) {
  toast.add({ title, description, type: "success" });
}

export function showError(title: string, description?: string) {
  toast.add({ title, description, type: "error" });
}

export function showInfo(title: string, description?: string) {
  toast.add({ title, description, type: "info" });
}
