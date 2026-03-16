// Checks if a URL is reachable. Tries HEAD first, falls back to GET
// for servers that reject HEAD (e.g. signed CDN URLs like Cloudflare R2).
// Returns the HTTP status code, or 0 for network errors.
async function checkUrl(url: string): Promise<number> {
  try {
    const headResponse = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (headResponse.ok) return headResponse.status;

    // HEAD returned non-success - try GET (some CDNs reject HEAD on signed URLs)
    const controller = new AbortController();
    const getResponse = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
    });
    const status = getResponse.status;
    controller.abort();
    return status;
  } catch {
    return 0;
  }
}

export { checkUrl };
