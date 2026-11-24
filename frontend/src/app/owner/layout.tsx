import RoleGuard from "../../components/auth/RoleGuard";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRole="Owner">{children}</RoleGuard>;
}