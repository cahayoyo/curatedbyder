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

type FeedbackOptions = { title?: string; hint?: string; emphasis?: string };

type SuccessModalContextValue = {
  success: (message: string) => void;
  error: (message: string, options?: FeedbackOptions) => void;
};

function renderMessage(message: string, emphasis?: string) {
  if (!emphasis) return message;
  const at = message.indexOf(emphasis);
  if (at < 0) return message;
  return (
    <>
      {message.slice(0, at)}
      <strong className="font-bold">{emphasis}</strong>
      {message.slice(at + emphasis.length)}
    </>
  );
}

const SuccessModalContext = createContext<SuccessModalContextValue | null>(null);

const DURATION = 2000;

export function SuccessModalProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [hint, setHint] = useState("");
  const [emphasis, setEmphasis] = useState("");
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
    (msg: string, v: FeedbackVariant, options?: FeedbackOptions) => {
      stopTimer();
      setMessage(msg);
      setTitle(options?.title ?? "");
      setHint(options?.hint ?? "");
      setEmphasis(options?.emphasis ?? "");
      setVariant(v);
      setOpen(true);
      setDeplete(false);
      setSeq((s) => s + 1);
    },
    [stopTimer],
  );

  const success = useCallback((msg: string) => show(msg, "success"), [show]);
  const error = useCallback(
    (msg: string, options?: FeedbackOptions) => show(msg, "error", options),
    [show],
  );

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
            className="relative w-full max-w-sm rounded-2xl bg-[#FDF7F3] p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Tutup"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#EDEBE8] text-[#4B5563] transition-colors hover:bg-[#E2DFDB]"
            >
              <X className="h-4 w-4" />
            </button>
            {variant === "error" ? (
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-[#F9D2D8]" />
                <XCircle className="relative h-10 w-10 text-[#E1445A]" />
              </div>
            ) : (
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            )}
            {title ? (
              <h2 className="mt-3 break-words text-lg font-bold text-black">
                {title}
              </h2>
            ) : null}
            <p
              className={cn(
                "break-words text-base text-black",
                variant === "error" ? "font-normal" : "font-semibold",
                title ? "mt-1" : "mt-3",
              )}
            >
              {renderMessage(message, emphasis)}
            </p>
            {hint ? (
              <p className="mt-1 break-words text-sm text-[#6B7280]">{hint}</p>
            ) : null}
            <div
              className={cn(
                "mt-5 h-1.5 w-full overflow-hidden rounded-full",
                variant === "error" ? "bg-[#F9D2D8]" : "bg-black/10",
              )}
            >
              <div
                className={cn(
                  "h-full",
                  variant === "error" ? "bg-[#E1445A]" : "bg-green-600",
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
