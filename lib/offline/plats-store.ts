"use client";

import { getDB } from "./db";
import type { PlatWithIngredients } from "@/lib/types/database.types";

export const platsStore = {
  async saveAll(plats: PlatWithIngredients[]) {
    const db = await getDB();
    const tx = db.transaction("plats", "readwrite");
    await Promise.all([...plats.map((p) => tx.store.put(p)), tx.done]);
  },
  async all(): Promise<PlatWithIngredients[]> {
    const db = await getDB();
    return db.getAll("plats");
  },
  async get(id: string): Promise<PlatWithIngredients | undefined> {
    const db = await getDB();
    return db.get("plats", id);
  },
};
