import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";

type ResetPasswordSearchParams = Promise<{
  error?: string;
  message?: string;
}>;

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function sendPasswordReset(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl()}/reset-password`,
  });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/reset-password?message=${encodeURIComponent("Check your email for reset instructions.")}`,
  );
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: ResetPasswordSearchParams;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>
            We will send a reset link to your email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={sendPasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            {params.error ? (
              <p className="text-sm text-destructive">{params.error}</p>
            ) : null}
            {params.message ? (
              <p className="text-sm text-muted-foreground">{params.message}</p>
            ) : null}
            <Button type="submit" className="w-full">
              Send reset link
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link className="font-medium text-foreground underline" href="/login">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
