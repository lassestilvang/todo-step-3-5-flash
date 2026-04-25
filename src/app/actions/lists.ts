"use server";

import { createList, updateList, deleteList, type ListRow } from "@/lib/db";
import type { CreateListData } from "@/types";
import { toList } from "./_helpers";
import { createListSchema, updateListSchema } from "@/lib/validation";

export async function createListAction(data: CreateListData) {
  const parsed = createListSchema.parse(data);
  const row = createList({
    name: parsed.name,
    color: parsed.color,
    icon: parsed.icon ?? "📋",
    parent_id: parsed.parentId,
  });
  return toList(row);
}

export async function updateListAction(id: string, data: Partial<CreateListData>) {
  const parsed = updateListSchema.parse(data);
  const updateData: Partial<ListRow> = {};
  if (parsed.name !== undefined) (updateData as Record<string, unknown>).name = parsed.name;
  if (parsed.color !== undefined) (updateData as Record<string, unknown>).color = parsed.color;
  if (parsed.icon !== undefined) (updateData as Record<string, unknown>).icon = parsed.icon;
  if (parsed.parentId !== undefined) (updateData as Record<string, unknown>).parent_id = parsed.parentId;
  const result = updateList(id, updateData);
  if (!result) return null;
  return toList(result);
}

export async function deleteListAction(id: string) {
  deleteList(id);
  return { id };
}
