"use client";

import { useSession } from "@/providers/SessionProvider";

export default function Home() {
  const { user } = useSession();
  return (
    <div>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}
