// src/app/auth/signin/page.tsx
"use client";

import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FaGoogle, FaFacebook, FaEnvelope } from "react-icons/fa";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react"; // Added useState here

export default function SignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const error = searchParams.get("error");
  const { data: session, status } = useSession();
  const router = useRouter();

  // State to hold the email input value
  const [email, setEmail] = useState("");

  // --- Logic to redirect authenticated users from this page ---
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace("/presentation");
    }
  }, [session, status, router]);
  // -----------------------------------------------------------

  // Modified handleSignIn to accept optional credentials (like email)
  const handleSignIn = async (provider: string, credentials?: Record<string, string>) => {
    // For email provider, credentials will contain the email
    // For OAuth providers, credentials will be undefined or empty, which is fine.
    // Ensure credentials is always an object to be spread correctly
    const signInOptions = { callbackUrl, ...(credentials ?? {}) };
    await signIn(provider, signInOptions);
  };

  // New function specifically for handling Email sign-in
  const handleEmailSignIn = async () => {
    if (!email) {
      // You can replace this alert with a more visually appealing error message
      // using your UI components (e.g., a toast or a simple text error below the input).
      alert("Please enter your email address.");
      return;
    }
    await handleSignIn("email", { email }); // Pass the email entered by the user
  };

  // Optionally, display a loading state while the session is being checked.
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading authentication...</p>
      </div>
    );
  }

  // Only render the sign-in form if the user is unauthenticated.
  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">
                  Authentication error. Please try again.
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Email Input Section */}
            <div className="grid gap-2">
              {/* You implicitly have Label and Input in your components/ui, so use them like this */}
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { // Allow pressing Enter in the email field to submit
                  if (e.key === 'Enter') {
                    void handleEmailSignIn();
                  }
                }}
                // Basic styling for the input if not using a specific UI library's Input component
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            {/* Email Sign-in Button */}
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={handleEmailSignIn} // Call the dedicated email sign-in handler
            >
              <FaEnvelope className="h-4 w-4" />
              Sign in with Email
            </Button>

            {/* Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Sign-in Buttons */}
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => handleSignIn("google")}
            >
              <FaGoogle className="h-4 w-4" />
              Sign in with Google
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => handleSignIn("facebook")}
            >
              <FaFacebook className="h-4 w-4" />
              Sign in with Facebook
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center gap-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return null;
}