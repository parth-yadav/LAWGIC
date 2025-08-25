import GoogleButton from "@/components/GoogleButton";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function Home() {
  return (
    <div>
      <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID as string}>
        <GoogleButton />
      </GoogleOAuthProvider>
    </div>
  );
}
