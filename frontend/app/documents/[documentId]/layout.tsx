import getUser from "@/auth/getUser";
import Unauthenticated from "@/components/auth/Unauthenticated";
import DocumentSidebar from "@/components/documents/Sidebar";

export default async function DocumentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { documentId: string };
}) {
  const user = await getUser();

  if (params.documentId === "test" || user) {
    return (
      <main className="flex flex-row">
        <DocumentSidebar />
        {children}
      </main>
    );
  }

  return <Unauthenticated />;
}
