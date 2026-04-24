"use client";

import { getDB, type MutationJob } from "./db";

export const mutationQueue = {
  async push(job: Omit<MutationJob, "id" | "createdAt">) {
    const db = await getDB();
    const full: MutationJob = {
      ...job,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    await db.put("mutations", full);
    return full;
  },
  async list(): Promise<MutationJob[]> {
    const db = await getDB();
    return db.getAllFromIndex("mutations", "by-created");
  },
  async remove(id: string) {
    const db = await getDB();
    await db.delete("mutations", id);
  },
  async clear() {
    const db = await getDB();
    await db.clear("mutations");
  },
};
