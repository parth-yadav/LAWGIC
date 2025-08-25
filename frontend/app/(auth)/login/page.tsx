"use client";
import GoogleButton from "@/components/auth/GoogleButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string>("");

  const sendOtp = async () => {};

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 w-sm max-w-full">
        <span className={cn("text-2xl font-bold")}>L O G I N</span>
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button onClick={sendOtp} className="w-full" size={"sm"}>
          Send OTP
        </Button>
        <Separator />
        <GoogleButton className="w-full" />
      </CardContent>
    </Card>
  );
}
