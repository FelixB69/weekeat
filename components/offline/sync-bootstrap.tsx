"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNetworkStore } from "@/lib/stores/network-store";
import { mutationQueue } from "@/lib/offline/queue";
import { platsKey } from "@/lib/hooks/use-plats";

export function SyncBootstrap() {
  const qc = useQueryClient();
  const setOnline = useNetworkStore((s) => s.setOnline);
  const setQueueSize = useNetworkStore((s) => s.setQueueSize);

  useEffect(() => {
    const refreshQueue = async () => {
      try {
        const jobs = await mutationQueue.list();
        setQueueSize(jobs.length);
      } catch {
        // IndexedDB may be unavailable (private mode)
      }
    };

    const handleOnline = async () => {
      setOnline(true);
      // Replay queued mutations — actual per-kind replay logic lives in the
      // mutation handlers; here we just invalidate queries so fresh data fetches.
      await refreshQueue();
      qc.invalidateQueries({ queryKey: platsKey });
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    refreshQueue();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [qc, setOnline, setQueueSize]);

  return null;
}
