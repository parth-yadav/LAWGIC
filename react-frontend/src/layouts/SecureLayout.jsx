import AuthGuard from "@/auth/AuthGuard";
import Unauthenticated from "@/components/auth/Unauthenticated";
import { Outlet } from "react-router-dom";

export default function SecureLayout() {
  return (
    <AuthGuard fallback={<Unauthenticated />}>
      <Outlet />
    </AuthGuard>
  );
}
