"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CampaignItem = {
  id: string;
  name: string;
  status: string;
  sent_count: number;
  pending_count: number;
  reviewed_count: number;
  created_at: string | null;
};

type CampaignManagerProps = {
  productId: string;
  campaigns: CampaignItem[];
};

export function CampaignManager({ productId, campaigns }: CampaignManagerProps) {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function onCreateCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsCreating(true);
    const form = event.currentTarget;

    const formData = new FormData(form);
    const payload = {
      product_id: productId,
      name: String(formData.get("name") ?? ""),
      email_subject: String(formData.get("email_subject") ?? ""),
      email_body: String(formData.get("email_body") ?? ""),
      recipients_text: String(formData.get("recipients_text") ?? ""),
    };

    let response: Response;
    try {
      response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      setError("Network error. Please try again.");
      setIsCreating(false);
      return;
    }

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      recipients_count?: number;
    };

    if (!response.ok) {
      setError(data.error ?? "Failed to create campaign.");
      setIsCreating(false);
      return;
    }

    form.reset();
    setNotice(
      `Campaign created with ${data.recipients_count ?? 0} recipient(s).`,
    );
    setIsCreating(false);
    window.location.reload();
  }

  async function onSendCampaign(campaignId: string) {
    setError(null);
    setNotice(null);
    setSendingId(campaignId);

    const response = await fetch(`/api/campaigns/${campaignId}/send`, {
      method: "POST",
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Failed to queue campaign.");
      setSendingId(null);
      return;
    }

    setNotice("Campaign queued for sending.");
    setSendingId(null);
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCreateCampaign} className="space-y-4 rounded-lg border p-4">
        <h2 className="text-base font-semibold">Create campaign</h2>

        <div className="space-y-2">
          <Label htmlFor="name">Campaign name</Label>
          <Input id="name" name="name" placeholder="May customer check-in" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email_subject">Email subject</Label>
          <Input
            id="email_subject"
            name="email_subject"
            placeholder="How is AgentTrust working for you?"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email_body">Email body</Label>
          <Textarea
            id="email_body"
            name="email_body"
            rows={6}
            placeholder="Hi {reviewer_name}, please share your feedback here: {review_link}"
            required
          />
          <p className="text-xs text-muted-foreground">
            Supported variables: {"{reviewer_name}"}, {"{review_link}"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipients_text">Recipients</Label>
          <Textarea
            id="recipients_text"
            name="recipients_text"
            rows={6}
            placeholder={"alice@company.com\nBob <bob@company.com>"}
            required
          />
          <p className="text-xs text-muted-foreground">
            One email per line, or comma-separated values.
          </p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {notice ? <p className="text-sm text-foreground">{notice}</p> : null}

        <Button type="submit" disabled={isCreating}>
          {isCreating ? "Creating..." : "Create campaign"}
        </Button>
      </form>

      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">{campaign.name}</p>
              <p className="text-xs text-muted-foreground">
                Status: {campaign.status} · Sent: {campaign.sent_count} · Pending:{" "}
                {campaign.pending_count} · Reviewed: {campaign.reviewed_count}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={sendingId === campaign.id || campaign.pending_count <= 0}
              onClick={() => onSendCampaign(campaign.id)}
            >
              {sendingId === campaign.id ? "Queueing..." : "Send"}
            </Button>
          </div>
        ))}

        {campaigns.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No campaigns yet. Create your first campaign above.
          </div>
        ) : null}
      </div>
    </div>
  );
}
