import { ImageResponse } from "next/og";
import { fetchChallengeBySlug } from "@/lib/api";

export const alt = "Vital30 challenge preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ slug: string }>;
};

const DIFFICULTY_LABEL: Record<string, string> = {
  BEGINNER: "Beginner",
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export default async function OgImage({ params }: Props) {
  const { slug } = await params;
  const challenge = await fetchChallengeBySlug(slug);

  const title = challenge?.title ?? "Vital30 Challenge";
  const subtitle =
    challenge?.shortDescription ??
    "30 days. Better habits. Healthier you.";
  const difficulty = challenge
    ? DIFFICULTY_LABEL[challenge.difficulty] ?? challenge.difficulty
    : null;
  const duration = challenge?.durationDays ?? 30;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #047857 0%, #10b981 50%, #34d399 100%)",
          padding: 72,
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "white",
              color: "#047857",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 32,
            }}
          >
            V
          </div>
          Vital30
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {difficulty ? (
            <div style={{ display: "flex", gap: 12 }}>
              <span
                style={{
                  padding: "10px 20px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.18)",
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {difficulty}
              </span>
              <span
                style={{
                  padding: "10px 20px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.18)",
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {duration} days
              </span>
            </div>
          ) : null}
          <h1
            style={{
              fontSize: 76,
              lineHeight: 1.05,
              fontWeight: 800,
              margin: 0,
              maxWidth: 1000,
              letterSpacing: -1,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 30,
              lineHeight: 1.35,
              margin: 0,
              maxWidth: 980,
              color: "rgba(255,255,255,0.92)",
            }}
          >
            {subtitle}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "rgba(255,255,255,0.85)",
            fontWeight: 500,
          }}
        >
          <span>30 days. Better habits. Healthier you.</span>
          <span>challenge.charangudla.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
