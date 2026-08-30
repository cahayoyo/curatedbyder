"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedbackVariant = "success" | "error";

type SuccessModalContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const SuccessModalContext = createContext<SuccessModalContextValue | null>(null);

const DURATION = 2000;

export function SuccessModalProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<FeedbackVariant>("success");
  const [open, setOpen] = useState(false);
  const [deplete, setDeplete] = useState(false);
  const [seq, setSeq] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    stopTimer();
    setOpen(false);
    setDeplete(false);
  }, [stopTimer]);

  const show = useCallback(
    (msg: string, v: FeedbackVariant) => {
      stopTimer();
      setMessage(msg);
      setVariant(v);
      setOpen(true);
      setDeplete(false);
      setSeq((s) => s + 1);
    },
    [stopTimer],
  );

  const success = useCallback((msg: string) => show(msg, "success"), [show]);
  const error = useCallback((msg: string) => show(msg, "error"), [show]);

  useEffect(() => {
    if (seq === 0) return;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setDeplete(true)),
    );
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setOpen(false);
      setDeplete(false);
    }, DURATION);
    return () => {
      cancelAnimationFrame(raf);
      stopTimer();
    };
  }, [seq, stopTimer]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <SuccessModalContext.Provider value={{ success, error }}>
      {children}
      {open && (
        <div
          role={variant === "error" ? "alert" : "status"}
          aria-live="polite"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={close}
        >
          <div
            className="relative w-full max-w-sm rounded-lg border bg-white p-6 text-center shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Tutup"
              className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            {variant === "error" ? (
              <XCircle className="mx-auto h-12 w-12 text-red-600" />
            ) : (
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            )}
            <p className="mt-3 break-words text-base font-semibold">{message}</p>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
              <div
                className={cn(
                  "h-full",
                  variant === "error" ? "bg-red-600" : "bg-green-600",
                )}
                style={{
                  width: deplete ? "0%" : "100%",
                  transition: `width ${DURATION}ms linear`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </SuccessModalContext.Provider>
  );
}

export function useSuccessModal() {
  const ctx = useContext(SuccessModalContext);
  if (!ctx) throw new Error("useSuccessModal must be used within SuccessModalProvider");
  return ctx;
}
