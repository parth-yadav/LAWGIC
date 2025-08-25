"use client";
import { useSession } from "@/providers/SessionProvider";

export default function Home() {
  const { user, status, error, refreshSession } = useSession();

  return (
    <div>
      {status === "loading" && <p>Loading...</p>}
      {status === "unauthenticated" && <p>{error}</p>}
      {status === "authenticated" && user && (
        <pre>{JSON.stringify(user, null, 2)}</pre>
      )}
    </div>
  );
}
