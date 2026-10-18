// =====================================================================
// Task 8 - fakeFetch.js
// Taimur Sajid (241839)
//
// An asynchronous stand-in for fetch(). It returns response-shaped objects
// ({ ok, status, statusText, url, json(), text() }) so getJSON() cannot tell
// it apart from the real Fetch API. Each route decides what to simulate:
//
//   { status: 200, body }       success
//   { status: 404 / 500 }       HTTP failure (fetch still RESOLVES for these)
//   { networkError: true }      fetch REJECTS with TypeError("fetch failed")
//   { rawBody: "..." }          a 200 whose body is not valid JSON
//   { delay: ms }               a slow response (can be aborted with a signal)
// =====================================================================

const STATUS_TEXT = { 200: "OK", 404: "Not Found", 500: "Internal Server Error", 503: "Service Unavailable" };

export function createFakeFetch(routes, { defaultDelay = 50 } = {}) {
  const calls = [];   // url + start time of each call, used to prove concurrency

  function fakeFetch(url, { signal } = {}) {
    calls.push({ url, startedAt: Date.now() });

    return new Promise((resolve, reject) => {
      const path = new URL(url, "http://campusflow.local").pathname;
      const route = routes[path] ?? { status: 404, body: { error: `no route for ${path}` } };

      const abortError = () => signal.reason ?? new DOMException("This operation was aborted", "AbortError");
      if (signal?.aborted) return reject(abortError());

      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        if (route.networkError) return reject(new TypeError("fetch failed"));

        const status = route.status ?? 200;
        const text = route.rawBody ?? JSON.stringify(route.body ?? null);
        resolve({
          ok: status >= 200 && status < 300,
          status,
          statusText: STATUS_TEXT[status] ?? "",
          url,
          text: async () => text,
          json: async () => JSON.parse(text)    // throws SyntaxError for bad JSON, like the real one
        });
      }, route.delay ?? defaultDelay);

      function onAbort() {
        clearTimeout(timer);
        reject(abortError());
      }
      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }

  fakeFetch.calls = calls;
  return fakeFetch;
}
