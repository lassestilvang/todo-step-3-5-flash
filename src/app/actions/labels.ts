"use server";

import { createLabel, updateLabel, deleteLabel } from "@/lib/db";
import type { Label } from "@/types";
import { toLabel } from "./_helpers";
import { createLabelSchema, updateLabelSchema } from "@/lib/validation";

export async function createLabelAction(name: string, color: string, icon?: string) {
  const parsed = createLabelSchema.parse({ name, color, icon });
  const row = createLabel({
    name: parsed.name,
    color: parsed.color,
    icon: parsed.icon,
  });
  return toLabel(row);
}

export async function updateLabelAction(id: string, name: string, color: string, icon?: string) {
  const parsed = updateLabelSchema.parse({ name, color, icon });
  const result = updateLabel(id, {
    name: parsed.name,
    color: parsed.color,
    icon: parsed.icon,
  });
  if (!result) return null;
  return toLabel(result);
}

export async function deleteLabelAction(id: string) {
  deleteLabel(id);
  return { id };
}
