// components/SplineEmbed.jsx
"use client"; // if using Next.js 13+ (App Router)

import React from "react";

export default function SplineEmbed() {
  return (
    <div
      style={{
        position: "fixed", // stays behind your layout
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        background: "transparent",
      }}
      aria-hidden
    >
      <iframe
        src="https://my.spline.design/purple3diconscopy-FlNGFtH2qrztKg4VVB72CPa5/"
        title="3D Background"
        frameBorder="0"
        width="100%"
        height="100%"
        style={{
          border: "none",
          opacity: 0.22,
          background: "transparent",
          pointerEvents: "none", // ensures it doesn't block clicks
          transition: "opacity 1s ease-in-out",
        }}
        loading="lazy"
      />
    </div>
  );
}
