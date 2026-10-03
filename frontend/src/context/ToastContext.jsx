import { useCallback, useMemo, useRef, useState } from "react";
import { ToastContext } from "./toastContext.js";
import ToastStack from "../components/ui/Toast.jsx";

const DEFAULT_DURATION = 5000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    ({ variant = "info", title, message, duration = DEFAULT_DURATION }) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, variant, title, message }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      push,
      dismiss,
      success: (message, title) => push({ variant: "success", message, title }),
      error: (message, title) => push({ variant: "error", message, title }),
      info: (message, title) => push({ variant: "info", message, title }),
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
