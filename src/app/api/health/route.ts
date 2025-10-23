import { NextRequest } from "next/server";

export async function GET() {
  const healthCheck = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    services: {
      ytmusic: "available",
      youtube: process.env.YOUTUBE_API_KEY ? "configured" : "not_configured",
      lyrics: "available"
    }
  };

  try {
    // Test YTMusic API availability
    const ytmusic = new (await import("ytmusic-api")).default();
    await ytmusic.initialize();
    healthCheck.services.ytmusic = "available";
  } catch {
    healthCheck.services.ytmusic = "unavailable";
    healthCheck.status = "degraded";
  }

  return Response.json(healthCheck, { 
    status: healthCheck.status === "ok" ? 200 : 503 
  });
}