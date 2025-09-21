import getUser from "@/auth/getUser";
import Unauthenticated from "@/components/auth/Unauthenticated";
import DocumentSidebar from "@/components/documents/Sidebar";

export default async function DocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (user) {
    return (
      <main className="flex h-dvh flex-row">
        <DocumentSidebar />
        {children}
      </main>
    );
  } else {
    return <Unauthenticated />;
  }
}
