// ============================================================================
// FILE: app/components/auth/RoleGuard.tsx
// PURPOSE: Client-side role guard for protected App Router sections
// ============================================================================
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../store/hooks";

export type AllowedRole = "Tenant" | "Owner" | "Admin";

interface RoleGuardProps {
  allowedRole: AllowedRole;
  children: React.ReactNode;
}

const ROLE_HOME_ROUTES: Record<AllowedRole, string> = {
  Tenant: "/tenant/tenantdashboard",
  Owner: "/owner/ownerdashboard",
  Admin: "/admin/admindashboard",
};

export default function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const reduxRole = useAppSelector((state:any) => state.user.role);
  const isAuthenticated = useAppSelector((state:any) => state.user.isAuthenticated);

  useEffect(() => {
    const localRole = localStorage.getItem("userChoice") as AllowedRole | null;
    const hasToken = !!localStorage.getItem("token");

    const effectiveRole = (reduxRole || localRole) as AllowedRole | null;
    const loggedIn = isAuthenticated || hasToken;

    if (!loggedIn || !effectiveRole) {
      setAuthorized(false);
      router.replace("/login");
      return;
    }

    if (effectiveRole !== allowedRole) {
      setAuthorized(false);
      router.replace(ROLE_HOME_ROUTES[effectiveRole] || "/login");
      return;
    }

    setAuthorized(true);
  }, [allowedRole, isAuthenticated, reduxRole, router]);

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}