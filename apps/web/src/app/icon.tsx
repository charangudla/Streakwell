import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 320,
          letterSpacing: -16,
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
