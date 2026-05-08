"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ReviewFormProps = {
  action: string;
  initialName?: string | null;
};

type SubmitState = {
  status: "idle" | "submitting" | "submitted" | "error";
  message?: string;
};

export function ReviewForm({ action, initialName }: ReviewFormProps) {
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const [rating, setRating] = useState("5");

  const ratingOptions = useMemo(() => [1, 2, 3, 4, 5], []);

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "submitting" });

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("rating", rating);

    const response = await fetch(action, {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      setState({
        status: "error",
        message: payload.error ?? "Unable to submit your review.",
      });
      return;
    }

    form.reset();
    setRating("5");
    setState({
      status: "submitted",
      message: "Thank you. Your review has been submitted.",
    });
  }

  if (state.status === "submitted") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thank you for the review</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{state.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share your experience</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submitReview} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reviewer_name">Name</Label>
              <Input
                id="reviewer_name"
                name="reviewer_name"
                defaultValue={initialName ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewer_role">Role/title</Label>
              <Input
                id="reviewer_role"
                name="reviewer_role"
                placeholder="Founder, PM, developer"
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Rating</legend>
            <div className="flex flex-wrap gap-2">
              {ratingOptions.map((value) => (
                <label
                  key={value}
                  className="flex h-10 cursor-pointer items-center gap-1 rounded-lg border px-3 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="rating_choice"
                    value={value}
                    checked={rating === String(value)}
                    onChange={() => setRating(String(value))}
                  />
                  <Star className="size-4" />
                  {value}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="title">Review title</Label>
            <Input
              id="title"
              name="title"
              placeholder="What stood out most?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Review</Label>
            <Textarea
              id="body"
              name="body"
              minLength={50}
              required
              rows={6}
              placeholder="Share what you used it for, what worked well, and who you would recommend it to."
            />
            <p className="text-xs text-muted-foreground">
              Minimum 50 characters.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="use_case">Use case</Label>
            <Textarea
              id="use_case"
              name="use_case"
              rows={3}
              placeholder="How do you use this product?"
            />
          </div>

          {state.status === "error" ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}

          <Button type="submit" disabled={state.status === "submitting"}>
            {state.status === "submitting" ? "Submitting..." : "Submit review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
