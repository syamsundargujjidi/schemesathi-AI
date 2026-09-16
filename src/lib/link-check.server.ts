// Server-only official-link health checking.
// Distinguishes "truly no longer valid" (404 / 410 / no such host) from
// "could not reach from here" (timeouts, blocks, server errors, geo-fences).

export type LinkCheckResult = {
  status: "ok" | "unreachable" | "invalid";
  httpStatus: number | null;
  note: string;
};

const TIMEOUT_MS = 8000;

function looksLikeUrl(value: string | null | undefined): value is string {
  return !!value && /^https?:\/\/[^\s]+\.[a-z]{2,}/i.test(value);
}

async function request(url: string, method: "HEAD" | "GET"): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; SchemeSathiLinkCheck/1.0)",
        accept: "text/html,application/xhtml+xml,*/*",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function checkOfficialLink(rawUrl: string | null | undefined): Promise<LinkCheckResult> {
  if (!looksLikeUrl(rawUrl)) {
    return { status: "invalid", httpStatus: null, note: "No official URL stored" };
  }

  let res: Response | null = null;
  let networkError: unknown = null;

  try {
    res = await request(rawUrl, "HEAD");
    // Many government portals reject HEAD; retry with GET before judging.
    if (res.status === 405 || res.status === 501 || res.status === 400) {
      res = await request(rawUrl, "GET");
    }
  } catch (err) {
    networkError = err;
    try {
      res = await request(rawUrl, "GET");
      networkError = null;
    } catch (err2) {
      networkError = err2;
    }
  }

  if (!res) {
    const message = networkError instanceof Error ? networkError.message : "network error";
    // DNS failure for the host is the only network-level signal strong enough
    // to call a link dead; everything else is "could not reach".
    if (/ENOTFOUND|getaddrinfo|dns|name not resolved/i.test(message)) {
      return { status: "invalid", httpStatus: null, note: "Website no longer exists (host not found)" };
    }
    return { status: "unreachable", httpStatus: null, note: `Could not reach (${message})` };
  }

  if (res.status === 404 || res.status === 410) {
    return { status: "invalid", httpStatus: res.status, note: `Page no longer exists (${res.status})` };
  }
  if (res.status >= 200 && res.status < 400) {
    return { status: "ok", httpStatus: res.status, note: "Reachable" };
  }
  // 401/403/429/5xx and anything else: the site exists but did not serve us.
  return { status: "unreachable", httpStatus: res.status, note: `Could not reach (HTTP ${res.status})` };
}
