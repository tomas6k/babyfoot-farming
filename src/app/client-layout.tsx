"use client";

import { Toaster } from "sonner";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
} 