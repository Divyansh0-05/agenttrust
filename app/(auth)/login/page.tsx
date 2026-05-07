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

type LoginSearchParams = Promise<{
  error?: string;
  message?: string;
}>;

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function signInWithPassword(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

async function sendMagicLink(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl()}/dashboard`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/login?message=${encodeURIComponent("Check your email for a magic link.")}`,
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: LoginSearchParams;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Access your AgentTrust dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signInWithPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {params.error ? (
              <p className="text-sm text-destructive">{params.error}</p>
            ) : null}
            {params.message ? (
              <p className="text-sm text-muted-foreground">{params.message}</p>
            ) : null}
            <div className="space-y-2">
              <Button type="submit" className="w-full">
                Sign in
              </Button>
              <Button
                type="submit"
                variant="outline"
                formAction={sendMagicLink}
                formNoValidate
                className="w-full"
              >
                Email me a magic link
              </Button>
            </div>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            New to AgentTrust?{" "}
            <Link className="font-medium text-foreground underline" href="/signup">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
