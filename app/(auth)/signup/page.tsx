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

type SignupSearchParams = Promise<{
  error?: string;
  message?: string;
}>;

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function signUp(formData: FormData) {
  "use server";

  const fullName = String(formData.get("full_name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${appUrl()}/dashboard`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/signup?message=${encodeURIComponent("Check your email to confirm your account.")}`,
  );
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SignupSearchParams;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Start collecting verified proof for your product.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Name</Label>
              <Input id="full_name" name="full_name" type="text" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
              />
            </div>
            {params.error ? (
              <p className="text-sm text-destructive">{params.error}</p>
            ) : null}
            {params.message ? (
              <p className="text-sm text-muted-foreground">{params.message}</p>
            ) : null}
            <Button type="submit" className="w-full">
              Sign up
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="font-medium text-foreground underline" href="/login">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
