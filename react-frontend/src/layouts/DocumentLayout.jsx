import AuthGuard from "@/auth/AuthGuard";
import Unauthenticated from "@/components/auth/Unauthenticated";
import DocumentSidebar from "@/components/documents/Sidebar";
import { Outlet } from "react-router-dom";

export default function DocumentLayout() {
  return (
    <AuthGuard fallback={<Unauthenticated />}>
      <main className="flex h-dvh flex-row">
        <DocumentSidebar />
        <Outlet />
      </main>
    </AuthGuard>
  );
}
