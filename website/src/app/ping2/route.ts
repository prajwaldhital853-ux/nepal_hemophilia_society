/** Public uptime / keep-alive probe — no auth, no middleware. Use for Render cron monitors. */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok", endpoint: "ping2" }, { status: 200 });
}

export function HEAD() {
  return new Response(null, { status: 200 });
}
