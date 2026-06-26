const TAROT_WORKER_URL = "https://tarot-ia.nicolasfernandeztoro.workers.dev";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return proxyToTarotWorker(request, "/health");
    }

    if (url.pathname === "/api/tarot") {
      return proxyToTarotWorker(request, "");
    }

    return env.ASSETS.fetch(request);
  }
};

async function proxyToTarotWorker(request, targetPath) {
  const sourceUrl = new URL(request.url);
  const targetUrl = new URL(`${TAROT_WORKER_URL}${targetPath}`);
  targetUrl.search = sourceUrl.search;

  const headers = new Headers();
  headers.set("Accept", request.headers.get("Accept") || "application/json");

  const contentType = request.headers.get("Content-Type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const proxied = new Request(targetUrl.toString(), {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "follow"
  });

  const response = await fetch(proxied);
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set("Cache-Control", "no-store");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}
