import AuthGuard from "@/auth/AuthGuard";
import Unauthenticated from "@/components/auth/Unauthenticated";
import DocumentSidebar from "@/components/documents/Sidebar";

export default async function DocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  <AuthGuard fallback={<Unauthenticated />}>
    <main className="flex h-dvh flex-row">
      <DocumentSidebar />
      {children}
    </main>
  </AuthGuard>;
}
