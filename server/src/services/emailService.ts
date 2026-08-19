import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { IUser } from "../models/User";
import type { IOrder, OrderStatus } from "../models/Order";
import { getClientUrl } from "../utils/tokens";

// Brand palette — mirrors client/src/index.css design tokens so email renders
// on-brand in clients that strip external stylesheets (inline styles only).
const BRAND = {
  name: "ShopNest",
  primary: "#4F46E5",
  accent: "#F97316",
  textPrimary: "#1F2937",
  textSecondary: "#4B5563",
  background: "#FAF9F6",
  surface: "#FFFFFF",
  border: "#E5E7EB",
};

// Build the (lazily created) Gmail SMTP transporter. Credentials come strictly
// from the environment — never hardcoded. GMAIL_APP_PASSWORD is a Gmail App
// Password generated at https://myaccount.google.com/apppasswords, not the
// account's normal password (Google blocks plain SMTP with the regular one).
const getTransporter = (): Transporter | null => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    return null;
  }
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // false -> upgrade to STARTTLS on 587
    auth: { user, pass },
  });
};

export const isEmailConfigured = (): boolean =>
  Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

// Reusable base send function. Email delivery is strictly best-effort: failures
// are logged but NEVER thrown, so a broken SMTP setup can never fail the
// business action that triggered the email (order creation, registration, ...).
export const sendEmail = async (
  to: string,
  subject: string,
  htmlBody: string
): Promise<void> => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(
      `[email] Skipping "${subject}" to ${to} — GMAIL_USER / GMAIL_APP_PASSWORD not configured.`
    );
    return;
  }
  try {
    await transporter.sendMail({
      from: `"${BRAND.name}" <${process.env.GMAIL_USER as string}>`,
      to,
      subject,
      html: htmlBody,
    });
    console.log(`[email] Sent "${subject}" to ${to}`);
  } catch (error) {
    // Log separately — the caller's business flow must not be affected.
    console.error(`[email] Failed to send "${subject}" to ${to}:`, error);
  }
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatINR = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

interface EmailLayoutOptions {
  headline: string;
  body: string;
  cta?: { label: string; href: string };
}

// Shared branded shell: header with the ShopNest wordmark, message body, and a
// muted footer. All styling is inline so it survives Gmail/Outlook sanitizers.
const emailLayout = ({ headline, body, cta }: EmailLayoutOptions): string => `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:${BRAND.background};font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:24px 32px;border-bottom:1px solid ${BRAND.border};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:20px;font-weight:700;color:${BRAND.textPrimary};">
                    <span style="color:${BRAND.primary};">&#9636;</span> ${BRAND.name}
                  </span>
                </td>
                <td align="right" style="font-size:12px;color:${BRAND.textSecondary};">
                  High-performance e-commerce
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:22px;color:${BRAND.textPrimary};">
              ${headline}
            </h1>
            <div style="font-size:15px;line-height:1.6;color:${BRAND.textSecondary};">
              ${body}
            </div>
            ${
              cta
                ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
                    <tr>
                      <td style="border-radius:8px;background-color:${BRAND.primary};">
                        <a href="${cta.href}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${cta.label}</a>
                      </td>
                    </tr>
                  </table>`
                : ""
            }
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid ${BRAND.border};font-size:12px;color:${BRAND.textSecondary};line-height:1.5;">
            <p style="margin:0 0 4px;">You received this email because you have an account with ${BRAND.name}.</p>
            <p style="margin:0;">Questions? Contact support and we&rsquo;ll be happy to help.</p>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`;

// ─── Specific notification helpers ─────────────────────────────────────────

export const sendWelcomeEmail = async (user: IUser): Promise<void> => {
  const firstName = user.name.split(/\s+/)[0] || user.name;
  await sendEmail(
    user.email,
    `Welcome to ${BRAND.name}, ${firstName}!`,
    emailLayout({
      headline: `Welcome to ${BRAND.name}, ${firstName}!`,
      body: `<p>Thanks for joining <strong>${BRAND.name}</strong> — your account is ready.</p>
             <p>Browse thousands of products with fast, typo-tolerant search and enjoy
             quick delivery. Your account details:</p>
             <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px;">
               <tr><td style="padding:4px 12px 4px 0;color:${BRAND.textSecondary};">Account name:</td><td style="font-weight:600;color:${BRAND.textPrimary};">${escapeHtml(user.name)}</td></tr>
               <tr><td style="padding:4px 12px 4px 0;color:${BRAND.textSecondary};">Email:</td><td style="font-weight:600;color:${BRAND.textPrimary};">${escapeHtml(user.email)}</td></tr>
             </table>`,
      cta: { label: "Start Shopping", href: `${getClientUrl()}/` },
    })
  );
};

export const sendEmailVerificationEmail = async (
  user: IUser,
  verificationLink: string
): Promise<void> => {
  await sendEmail(
    user.email,
    "Verify your ShopNest email",
    emailLayout({
      headline: "Confirm your email address",
      body: `<p>Hi ${escapeHtml(user.name)},</p>
             <p>To secure your account, please confirm your email address by clicking
             the button below. This link expires in 24 hours.</p>`,
      cta: { label: "Verify Email", href: verificationLink },
    })
  );
};

export const sendOrderConfirmationEmail = async (
  user: IUser,
  order: IOrder
): Promise<void> => {
  const itemsRows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;color:${BRAND.textPrimary};">${escapeHtml(item.name)} &times; ${item.quantity}</td>
        <td align="right" style="padding:8px 0;color:${BRAND.textPrimary};">${formatINR(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  const discountRow =
    order.discount > 0
      ? `<tr>
          <td style="padding:8px 0;color:${BRAND.textSecondary};">Discount${order.discountCode ? ` (${escapeHtml(order.discountCode)})` : ""}</td>
          <td align="right" style="padding:8px 0;color:${BRAND.textSecondary};">&minus;${formatINR(order.discount)}</td>
        </tr>`
      : "";

  await sendEmail(
    user.email,
    `Order ${order.id} confirmed — thank you!`,
    emailLayout({
      headline: `Order ${order.id} placed successfully`,
      body: `<p>Hi ${escapeHtml(user.name)},</p>
             <p>Thanks for your order! Here&rsquo;s a summary:</p>
             <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px;">
               <tr>
                 <td style="padding:8px 0;font-weight:600;color:${BRAND.textPrimary};border-bottom:1px solid ${BRAND.border};">Item</td>
                 <td align="right" style="padding:8px 0;font-weight:600;color:${BRAND.textPrimary};border-bottom:1px solid ${BRAND.border};">Amount</td>
               </tr>
               ${itemsRows}
               ${discountRow}
               <tr>
                 <td style="padding:10px 0;font-weight:700;color:${BRAND.textPrimary};border-top:2px solid ${BRAND.border};">Total</td>
                 <td align="right" style="padding:10px 0;font-weight:700;color:${BRAND.accent};border-top:2px solid ${BRAND.border};">${formatINR(order.total)}</td>
               </tr>
             </table>
             <p>You can track delivery and view the full order timeline any time.</p>`,
      cta: { label: "View Order", href: `${getClientUrl()}/orders/${order.id}` },
    })
  );
};

export const sendPasswordResetEmail = async (
  user: IUser,
  resetLink: string
): Promise<void> => {
  await sendEmail(
    user.email,
    "Reset your ShopNest password",
    emailLayout({
      headline: "Reset your password",
      body: `<p>Hi ${escapeHtml(user.name)},</p>
             <p>We received a request to reset the password for your <strong>${BRAND.name}</strong>
             account. Click the button below to choose a new one. This link expires
             in one hour.</p>
             <p style="font-size:13px;color:${BRAND.textSecondary};">If you didn&rsquo;t request this, you can safely ignore this email — your password won&rsquo;t change.</p>`,
      cta: { label: "Reset Password", href: resetLink },
    })
  );
};

const STATUS_EMOJI: Record<OrderStatus, string> = {
  pending: "&#9203;",
  confirmed: "&#9989;",
  shipped: "&#128666;",
  delivered: "&#127881;",
  cancelled: "&#9888;&#65039;",
};

export const sendOrderStatusUpdateEmail = async (
  user: IUser,
  order: IOrder,
  newStatus: OrderStatus
): Promise<void> => {
  await sendEmail(
    user.email,
    `Order ${order.id} is now ${newStatus}`,
    emailLayout({
      headline: `${STATUS_EMOJI[newStatus]} Order ${order.id} is now <span style="text-transform:capitalize;">${newStatus}</span>`,
      body: `<p>Hi ${escapeHtml(user.name)},</p>
             <p>Your order <strong>#${order.id}</strong> (${formatINR(order.total)}) has been updated
             to <strong style="text-transform:capitalize;">${newStatus}</strong>.</p>
             <p>Check the order timeline for the latest updates, including tracking
             details once your shipment is on its way.</p>`,
      cta: { label: "View Order", href: `${getClientUrl()}/orders/${order.id}` },
    })
  );
};
