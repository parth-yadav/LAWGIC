"use client";
import { Button } from "@/components/ui/button";
import ApiClient from "@/utils/ApiClient";

export default function GoogleButton() {
  const handleGoogleLogin = async () => {
    try {
      const { data } = await ApiClient.get("/auth/google/url");
      window.location.href = data.data.url;
    } catch (e) {
      console.log("Error while Google Login...", e);
    }
  };

  return <Button onClick={handleGoogleLogin}>Sign In with Google</Button>;
}
