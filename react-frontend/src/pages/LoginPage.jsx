import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Countdown from "react-countdown";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GoogleButton from "@/components/auth/GoogleButton";
import ApiClient from "@/utils/ApiClient";
import { useSession } from "@/providers/SessionProvider";
import { getErrorMessage } from "@/utils/utils";
import { LoaderCircleIcon } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshSession } = useSession();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email) return toast.error("Please enter your email");
    setLoading(true);
    try {
      const res = await ApiClient.post("/auth/send-otp", { email });
      if (res.data.success) {
        toast.success("OTP sent to your email");
        setStep("otp");
        setCountdown(Date.now() + 60000);
      } else {
        toast.error(res.data.error?.message || "Failed to send OTP");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to send OTP"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!otp || otp.length < 6) return toast.error("Please enter the OTP");
    setLoading(true);
    try {
      const res = await ApiClient.post("/auth/verify-otp", { email, otp });
      if (res.data.success) {
        toast.success("Login successful");
        await refreshSession();
        navigate("/");
      } else {
        toast.error(res.data.error?.message || "Invalid OTP");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Verification failed"));
    } finally {
      setLoading(false);
    }
  };

  const countdownRenderer = ({ minutes, seconds, completed }) => {
    if (completed) {
      return (
        <Button
          type="button"
          variant="link"
          onClick={handleSendOtp}
          className="text-xs"
        >
          Resend OTP
        </Button>
      );
    }
    return (
      <span className="text-muted-foreground text-xs">
        Resend in {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    );
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to your account
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Send OTP
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <p className="text-muted-foreground text-center text-sm">
            Enter the OTP sent to <strong>{email}</strong>
          </p>
          <div className="flex flex-col items-center gap-2">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Verify OTP
          </Button>
          <div className="flex items-center justify-center">
            {countdown && (
              <Countdown
                ref={countdownRef}
                date={countdown}
                renderer={countdownRenderer}
              />
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStep("email");
              setOtp("");
            }}
            className="text-xs"
          >
            Change email
          </Button>
        </form>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            Or continue with
          </span>
        </div>
      </div>

      <GoogleButton />
    </div>
  );
}
