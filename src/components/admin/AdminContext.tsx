"use client";

import { createContext, use, useState, type ReactNode } from "react";

type Ctx = { changes: number; setChanges: (n: number) => void };
const AdminCtx = createContext<Ctx>({ changes: 0, setChanges: () => {} });

/** Shares the "unpublished changes" counter between the editors and the publish bar. */
export function AdminProvider({ initialChanges, children }: { initialChanges: number; children: ReactNode }) {
  const [changes, setChanges] = useState(initialChanges);
  // When the server sends a fresh count (after router.refresh), adopt it.
  const [prev, setPrev] = useState(initialChanges);
  if (prev !== initialChanges) {
    setPrev(initialChanges);
    setChanges(initialChanges);
  }
  return <AdminCtx value={{ changes, setChanges }}>{children}</AdminCtx>;
}

export const useAdmin = () => use(AdminCtx);
