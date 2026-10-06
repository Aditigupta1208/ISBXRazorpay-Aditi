import { ImageResponse } from "next/og";

export const alt = "Dispute Advisor: concept prototype";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#F9F9F9", color: "#000" }}>
        <div style={{ fontSize: 28, color: "#2F63C8", fontWeight: 700 }}>Concept prototype</div>
        <div style={{ fontSize: 84, fontWeight: 700, marginTop: 12 }}>Dispute Advisor</div>
        <div style={{ fontSize: 36, color: "#444", marginTop: 20, maxWidth: 900 }}>
          Fight, fold or escalate a card dispute, with every sentence cited.
        </div>
        <div style={{ fontSize: 24, color: "#6B6B6B", marginTop: 48 }}>
          For the Razorpay x ISB AI PM Build Challenge. Not an official Razorpay product.
        </div>
      </div>
    ),
    size,
  );
}
