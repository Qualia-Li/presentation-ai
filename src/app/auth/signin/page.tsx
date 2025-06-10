// src/app/auth/signin/page.tsx
"use client";

import { signIn, useSession } from "next-auth/react"; // Added useSession
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FaGoogle, FaFacebook, FaEnvelope } from "react-icons/fa"; // Added FaFacebook, FaEnvelope
import { useSearchParams, useRouter } from "next/navigation"; // Added useRouter
import { useEffect } from "react"; // Added useEffect

export default function SignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const error = searchParams.get("error");
  const { data: session, status } = useSession(); // Get session data and status
  const router = useRouter(); // Initialize router

  // --- Logic to redirect authenticated users from this page ---
  useEffect(() => {
    // If the user is authenticated and is currently on an authentication page,
    // redirect them to the main application page (e.g., /presentation).
    if (status === "authenticated" && session) {
      router.replace("/presentation"); // Use replace to prevent going back to the sign-in page
    }
  }, [session, status, router]); // Dependencies ensure the effect re-runs if these values change
  // -----------------------------------------------------------

  const handleSignIn = async (provider: string) => {
    // IMPORTANT: Ensure the provider ID matches what's configured in auth.ts
    // The default for EmailProvider is usually "email".
    await signIn(provider, { callbackUrl });
  };

  // Optionally, display a loading state while the session is being checked.
  // This prevents the form from flashing before the redirect occurs.
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading authentication...</p>
      </div>
    );
  }

  // Only render the sign-in form if the user is unauthenticated.
  // If `status` is "authenticated", the useEffect above will handle the redirect.
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
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => handleSignIn("google")}
            >
              <FaGoogle className="h-4 w-4" />
              Sign in with Google
            </Button>

            {/* --- Facebook Sign-in Button --- */}
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => handleSignIn("facebook")}
            >
              <FaFacebook className="h-4 w-4" />
              Sign in with Facebook
            </Button>

            {/* --- Email Sign-in Button --- */}
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => handleSignIn("email")} // Assuming "email" is the provider ID in auth.ts
            >
              <FaEnvelope className="h-4 w-4" />
              Sign in with Email
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

  return null; // Return null if authenticated (redirect handled by useEffect) or if loading
}