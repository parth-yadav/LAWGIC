import RevealHero from "@/components/animations/RevealHero";
import Unauthenticated from "@/components/auth/Unauthenticated";
import getUser from "@/auth/getUser";
import ProfileForm from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const user = await getUser();

  if (!user) return <Unauthenticated />;

  return (
    <section className="flex w-full flex-col p-4 items-center max-w-2xl mx-auto">
      <RevealHero className="font-extrabold text-3xl mb-8">Profile</RevealHero>
      <ProfileForm user={user} />
    </section>
  );
}
