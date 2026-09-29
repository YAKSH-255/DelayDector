"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getRole } from "@/lib/data";
import { scopeFor } from "@/lib/scope";
import type { Role } from "@/lib/types";

const STORAGE_KEY = "delaydector.role";

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
  ready: boolean;
}

const RoleContext = createContext<RoleContextValue>({
  role: "mospi",
  setRole: () => {},
  ready: false,
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("mospi");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Role | null;
    if (stored === "mospi" || stored === "department" || stored === "officer") {
      setRoleState(stored);
    }
    setReady(true);
  }, []);

  const setRole = useCallback((next: Role) => {
    setRoleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(() => ({ role, setRole, ready }), [role, setRole, ready]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export const useRole = () => useContext(RoleContext);

/** Role-filtered projects plus the headline counts for that role. */
export function useScope() {
  const { role, ready } = useRole();
  const scope = useMemo(() => scopeFor(role), [role]);
  return { ...scope, definition: getRole(role), ready };
}
