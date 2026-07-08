import "@/styles/global.css";
import React from "react";
import Providers from "../components/providers";
import FloatingChatbot from "../components/FloatingChatbot";
import WorkspaceLayout from "../components/navigation/WorkspaceLayout";

export const metadata = {
  title: "StartupForge AI - Autonomous Venture Studio",
  description: "Transform startup ideas into investor-ready businesses with coordinated venture agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased transition-colors duration-200">
        <div className="radial-glow-container">
          <div className="radial-glow-1" />
          <div className="radial-glow-2" />
          <div className="radial-glow-3" />
        </div>
        <Providers>
          <WorkspaceLayout>
            {children}
          </WorkspaceLayout>
          <FloatingChatbot />
        </Providers>
      </body>
    </html>
  );
}
