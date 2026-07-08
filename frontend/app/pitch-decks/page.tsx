"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2 } from "lucide-react";

export default function PitchDecksRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const startupsRes = await axios.get("/api/v1/startups");
        const list = startupsRes.data || [];
        if (list.length > 0) {
          router.replace(`/project/${list[0].id}?tab=pitchdeck`);
        } else {
          alert("Please select or forge a startup concept from the dashboard first to view this workspace detail.");
          router.replace("/dashboard");
        }
      } catch {
        router.replace("/dashboard");
      }
    };
    handleRedirect();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
}
