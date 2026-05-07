import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { ProductForm } from "./product-form";

export default async function NewProductPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>New product</CardTitle>
          <CardDescription>
            Add the basics now. Reviews, revenue, and widgets come next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm />
        </CardContent>
      </Card>
    </main>
  );
}
