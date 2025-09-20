import getUser from "@/auth/getUser";
import Unauthenticated from "@/components/auth/Unauthenticated";
import DocumentSidebar from "@/components/documents/Sidebar";

export default async function DocumentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ documentId: string }>;
}) {
  const user = await getUser();

  const { documentId } = await params;

  if (documentId === "test" || user) {
    return (
      <main className="flex h-dvh flex-row">
        <DocumentSidebar />
        {children}
      </main>
    );
  }

  return <Unauthenticated />;
}
