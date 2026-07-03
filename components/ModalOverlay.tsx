"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalOverlayProps {
  open: boolean;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export default function ModalOverlay({
  open,
  children,
  onClose,
  className = "",
}: ModalOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xl ${className}`}
      onClick={onClose}
      role="presentation"
    >
      {children}
    </div>,
    document.body
  );
}
