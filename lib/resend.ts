import { Resend } from "resend";

type SendReviewRequestEmailInput = {
  to: string;
  reviewerName?: string | null;
  productName: string;
  subject: string;
  body: string;
  reviewLink: string;
};

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function senderEmail() {
  if (process.env.NODE_ENV === "production") {
    return process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  }

  return "onboarding@resend.dev";
}

function applyTemplateVariables(
  body: string,
  reviewerName: string | null | undefined,
  reviewLink: string,
) {
  return body
    .replaceAll("{reviewer_name}", reviewerName?.trim() || "there")
    .replaceAll("{review_link}", reviewLink);
}

export async function sendReviewRequestEmail({
  to,
  reviewerName,
  productName,
  subject,
  body,
  reviewLink,
}: SendReviewRequestEmailInput) {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const htmlBody = applyTemplateVariables(body, reviewerName, reviewLink)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 12px;">${line}</p>`)
    .join("");

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5;color:#111827;">
      <h2 style="margin:0 0 12px;">Review request for ${productName}</h2>
      ${htmlBody}
      <p style="margin:20px 0;">
        <a href="${reviewLink}" style="display:inline-block;padding:10px 14px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
          Leave a review
        </a>
      </p>
      <p style="margin:0;color:#6b7280;font-size:13px;">If the button does not work, use this link:</p>
      <p style="margin:4px 0 0;"><a href="${reviewLink}" style="color:#2563eb;">${reviewLink}</a></p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: senderEmail(),
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message || "Failed to send email.");
  }
}
