"use client";

import { useEffect, useState } from "react";
import { IconWifiOff } from "@/components/ui/icons";

export function OfflineBadge() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 anim-fadeUp">
      <div className="flex items-center gap-2 bg-[var(--t1)] text-white text-xs font-semibold rounded-full px-3 py-1.5 shadow-lg">
        <IconWifiOff size={14} />
        Mode hors ligne
      </div>
    </div>
  );
}
