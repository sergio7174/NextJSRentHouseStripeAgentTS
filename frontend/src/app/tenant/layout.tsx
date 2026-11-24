import RoleGuard from "../../components/auth/RoleGuard";

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRole="Tenant">{children}</RoleGuard>;
}