import { createList, updateList, deleteList } from "@/lib/db";
import type { CreateListData, TaskList } from "@/types";
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
  const updateData: any = {};
  if (parsed.name !== undefined) updateData.name = parsed.name;
  if (parsed.color !== undefined) updateData.color = parsed.color;
  if (parsed.icon !== undefined) updateData.icon = parsed.icon;
  if (parsed.parentId !== undefined) updateData.parent_id = parsed.parentId;
  const result = updateList(id, updateData);
  if (!result) return null;
  return toList(result);
}

export async function deleteListAction(id: string) {
  deleteList(id);
  return { id };
}
