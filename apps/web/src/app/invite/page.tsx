"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { BackLink } from "@/components/BackLink";
import { Container } from "@/components/Container";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { ReferralInfo } from "@/lib/web-types";

export default function InvitePage() {
  return (
    <AuthGuard>
      <InviteInner />
    </AuthGuard>
  );
}

function InviteInner() {
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Redeem state
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  async function load() {
    try {
      const r = await apiClient<ReferralInfo>("/referrals/me");
      setInfo(r);
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function onCopy() {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.code);
      setRedeemMessage(`Copied ${info.code} to clipboard.`);
      setTimeout(() => setRedeemMessage(null), 2000);
    } catch {
      /* ignore */
    }
  }

  async function onShare() {
    if (!info) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ text: info.shareText }).catch(() => {});
    } else {
      try {
        await navigator.clipboard.writeText(info.shareText);
        setRedeemMessage("Share text copied to clipboard.");
        setTimeout(() => setRedeemMessage(null), 2000);
      } catch {
        /* ignore */
      }
    }
  }

  async function onRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (redeeming || !code.trim()) return;
    setRedeeming(true);
    setRedeemError(null);
    setRedeemMessage(null);
    try {
      await apiClient("/referrals/redeem", {
        method: "POST",
        body: { code: code.trim() },
      });
      setRedeemMessage("Referral code redeemed.");
      setCode("");
      await load();
    } catch (e) {
      if (e instanceof ApiClientError) {
        setRedeemError(e.bodyMessage);
      } else {
        setRedeemError((e as Error).message);
      }
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <section className="py-10 sm:py-12">
      <Container className="max-w-2xl">
        <BackLink />
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Invite friends
        </h1>

        {err ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {err}
          </p>
        ) : null}

        {info ? (
          <>
            <div className="mt-8 rounded-2xl bg-ink p-6 text-white sm:p-8">
              <p className="text-base text-slate-300">
                Bring a friend — better together.
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {info.referredCount === 0
                  ? "Friends who start a challenge together are 2x more likely to finish."
                  : `${info.referredCount} ${info.referredCount === 1 ? "friend has" : "friends have"} joined with your code.`}
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Your invite code
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="font-mono text-2xl font-bold tracking-wider text-ink">
                  {info.code}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onCopy}
                    className="inline-flex h-10 items-center rounded-full bg-slate-100 px-4 text-sm font-semibold text-ink hover:bg-slate-200"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={onShare}
                    className="inline-flex h-10 items-center rounded-full bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-8 h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        )}

        <form
          onSubmit={onRedeem}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"
          noValidate
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Have a code?
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Enter a friend&rsquo;s code to credit them as your referrer.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD1234"
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-base font-mono uppercase tracking-wider text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <button
              type="submit"
              disabled={!code.trim() || redeeming}
              className="inline-flex h-11 items-center justify-center rounded-full bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {redeeming ? "Redeeming…" : "Redeem"}
            </button>
          </div>
          {redeemError ? (
            <p className="mt-2 text-sm text-rose-700">{redeemError}</p>
          ) : null}
          {redeemMessage ? (
            <p className="mt-2 text-sm font-semibold text-brand-700">
              {redeemMessage}
            </p>
          ) : null}
        </form>
      </Container>
    </section>
  );
}
