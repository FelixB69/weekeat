"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { PlatWithIngredients, PlanningComplet } from "@/lib/types/database.types";

export interface MutationJob {
  id: string;
  createdAt: number;
  kind: "plat.create" | "plat.update" | "plat.delete" | "planning.upsert";
  payload: unknown;
}

interface WeekeatDB extends DBSchema {
  plats: {
    key: string;
    value: PlatWithIngredients;
    indexes: { "by-updated": string };
  };
  plannings: {
    key: string; // semaine_debut
    value: PlanningComplet;
  };
  mutations: {
    key: string;
    value: MutationJob;
    indexes: { "by-created": number };
  };
  meta: {
    key: string;
    value: unknown;
  };
}

let _db: Promise<IDBPDatabase<WeekeatDB>> | null = null;

export function getDB() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB non disponible côté serveur");
  }
  if (!_db) {
    _db = openDB<WeekeatDB>("weekeat", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("plats")) {
          const plats = db.createObjectStore("plats", { keyPath: "id" });
          plats.createIndex("by-updated", "updated_at");
        }
        if (!db.objectStoreNames.contains("plannings")) {
          db.createObjectStore("plannings", { keyPath: "semaine_debut" });
        }
        if (!db.objectStoreNames.contains("mutations")) {
          const mut = db.createObjectStore("mutations", { keyPath: "id" });
          mut.createIndex("by-created", "createdAt");
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta");
        }
      },
    });
  }
  return _db;
}
