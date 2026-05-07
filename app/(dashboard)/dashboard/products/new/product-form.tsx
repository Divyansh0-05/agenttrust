"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const categories = ["SaaS", "Apps", "AI Tools", "Open Source", "Productivity"];

export function ProductForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/products", {
      method: "POST",
      body: new FormData(event.currentTarget),
    });

    const data = (await response.json()) as { id?: string; error?: string };

    if (!response.ok || !data.id) {
      setError(data.error ?? "Unable to create product.");
      setIsSubmitting(false);
      return;
    }

    router.push(`/dashboard/products/${data.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website_url">Website URL</Label>
        <Input
          id="website_url"
          name="website_url"
          type="url"
          placeholder="https://example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          required
          className="h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue=""
        >
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input
          id="tagline"
          name="tagline"
          maxLength={140}
          placeholder="A short promise for your product"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          placeholder="What does it help customers do?"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo">Logo</Label>
        <Input id="logo" name="logo" type="file" accept="image/*" />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating..." : "Create product"}
      </Button>
    </form>
  );
}
