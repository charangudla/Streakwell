import { ImageResponse } from "next/og";

// Apple Touch Icon — square, no transparency. iOS will round the corners
// itself when added to the home screen.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #047857 0%, #10b981 60%, #34d399 100%)",
          color: "white",
          fontWeight: 800,
          fontSize: 110,
          letterSpacing: -4,
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        V
      </div>
    ),
    { ...size },
  );
}
