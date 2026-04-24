export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-[var(--bg)] flex flex-col items-stretch">
      <div className="mx-auto w-full max-w-[460px] flex-1 flex flex-col px-6 pt-12 pb-safe">
        {children}
      </div>
    </main>
  );
}
