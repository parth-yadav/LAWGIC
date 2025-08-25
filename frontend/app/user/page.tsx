import getUser from "@/auth/getUser";

export default async function UserPage() {
  const user = await getUser();

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div>
      <h1>{user.name}'s Profile</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}
