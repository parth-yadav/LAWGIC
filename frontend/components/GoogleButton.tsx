"use client";
import { Button } from "@/components/ui/button";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

export default function GoogleButton() {
  const responseGoogle = async (authResult: any) => {
    try {
      if (authResult["code"]) {
        const result = await axios.get(
          `http://localhost:6900/auth/google?code=${authResult.code}`,
          { withCredentials: true }
        );
        console.log(result);
      } else {
        console.log(authResult);
        throw new Error(authResult);
      }
    } catch (e) {
      console.log("Error while Google Login...", e);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
  });
  return <Button onClick={googleLogin}>Sign In with Google</Button>;
}
