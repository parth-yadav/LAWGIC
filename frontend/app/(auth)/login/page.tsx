"use client";
import GoogleButton from "@/components/auth/GoogleButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import ApiClient from "@/utils/ApiClient";
import { LoaderCircleIcon, LogInIcon, SendIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { useRouter } from "next/navigation";
import { useSession } from "@/providers/SessionProvider";
import Countdown, { CountdownRendererFn } from "react-countdown";

export default function LoginPage() {
  const router = useRouter();
  const { refreshSession } = useSession();
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [sendingOtp, startSendingOtp] = useTransition();
  const [verifyingOtp, startVerifyingOtp] = useTransition();

  const sendOtp = async () => {
    startSendingOtp(async () => {
      try {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          toast.error("Please enter a valid email address");
          return;
        }
        const {
          data: { success, data },
        }: { data: ApiResponseData<{ otpExpiresAt: Date }> } =
          await ApiClient.post("/auth/email/login", {
            email,
          });

        const { otpExpiresAt } = data!;

        if (success) {
          setOtpSent(true);
          setOtpExpiresAt(otpExpiresAt);
          toast.success(`OTP sent to ${email}`);
        } else {
          toast.error("Error sending OTP");
        }
      } catch (error) {
        toast.error("Error sending OTP");
      }
    });
  };

  const verifyOtp = async () => {
    startVerifyingOtp(async () => {
      if (!(otp.trim() && otp.length === 6)) {
        toast.error("Please enter a valid OTP");
        return;
      }

      try {
        const {
          data: { success },
        }: { data: { success: boolean } } = await ApiClient.post(
          "/auth/email/verify",
          {
            email,
            otp,
          }
        );
        if (success) {
          toast.success("OTP verified successfully");
          refreshSession();
          router.push("/");
        } else {
          toast.error("Error verifying OTP");
        }
      } catch (error) {
        toast.error("Error verifying OTP");
      }
    });
  };

  const CountdownRenderer: CountdownRendererFn = ({
    minutes,
    seconds,
    completed,
  }) => {
    if (completed) {
      return <span className="text-red-500">OTP has expired</span>;
    } else {
      return <span>{`OTP expires in ${minutes}:${seconds}`}</span>;
    }
  };

  const handleOtpExpired = () => {
    setOtpSent(false);
    setOtp("");
    setOtpExpiresAt(null);
    toast.error("OTP has expired", { description: "Try logging in again" });
  };

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 w-sm max-w-full">
        <span className={cn("text-2xl font-bold")}>L O G I N</span>
        {otpSent ? (
          <>
            <span className="font-light">
              Verify OTP sent to <b className="font-bold underline">{email}</b>
            </span>
            {otpExpiresAt && (
              <Countdown
                date={otpExpiresAt}
                renderer={CountdownRenderer}
                onComplete={handleOtpExpired}
              />
            )}
            <InputOTP
              value={otp}
              onChange={(otp) => setOtp(otp)}
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  verifyOtp();
                }
              }}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <Button
              onClick={verifyOtp}
              disabled={verifyingOtp}
              className="w-full"
              size={"sm"}
            >
              {verifyingOtp ? "Verifying..." : "Verify OTP"}
              {verifyingOtp ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <LogInIcon />
              )}
            </Button>
          </>
        ) : (
          <>
            <Input
              name="email"
              placeholder="Enter your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendOtp();
                }
              }}
            />
            <Button
              onClick={sendOtp}
              disabled={sendingOtp}
              className="w-full"
              size={"sm"}
            >
              {sendingOtp ? "Sending..." : "Send OTP"}
              {sendingOtp ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <SendIcon />
              )}
            </Button>
            <Separator />
            <GoogleButton className="w-full" />
          </>
        )}
      </CardContent>
    </Card>
  );
}
