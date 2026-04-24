"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

interface ToastCtx {
  show: (msg: string) => void;
}
const Ctx = createContext<ToastCtx>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((m: string) => {
    if (ref.current) clearTimeout(ref.current);
    setMsg(m);
    ref.current = setTimeout(() => setMsg(null), 2600);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {msg && (
        <div className="toast" role="status" aria-live="polite">
          <div className="toast-dot" />
          {msg}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
