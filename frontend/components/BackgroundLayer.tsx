"use client";

import React from "react";

export default function BackgroundLayer() {
  return (
    <>
      {/* Layer 0: Fixed background image */}
      <div 
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -100,
          pointerEvents: "none",
          overflow: "hidden",
          backgroundImage: "url('/hero-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
        className="opacity-15 dark:opacity-22"
      />
      {/* Layer 1: Subtle readability gradient overlay */}
      <div className="global-bg-overlay" />
    </>
  );
}
