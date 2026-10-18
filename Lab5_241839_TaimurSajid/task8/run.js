// Task 8 runner:  npm run task8
import { createFakeFetch } from "./fakeFetch.js";
import { getJSON, fetchWithTimeout, loadDashboardData, buildDashboard } from "./aggregator.js";

const BASE = "http://campusflow.local/api";

const data = {
  users: [
    { id: 1, name: "Ali", department: "CS" },
    { id: 2, name: "Sara", department: "CS" },
    { id: 3, name: "Usman", department: "SE" },
    { id: 4, name: "Hina", department: "AI" },
    { id: 5, name: "Ahmed", department: "SE" }
  ],
  courses: [
    { code: "CS301", title: "Data Structures" },
    { code: "CS302", title: "Databases" },
    { code: "CS401", title: "Web Engineering" }
  ],
  results: [
    { studentId: 1, course: "CS301", marks: 82 }, { studentId: 1, course: "CS302", marks: 76 },
    { studentId: 2, course: "CS301", marks: 93 }, { studentId: 2, course: "CS401", marks: 89 },
    { studentId: 3, course: "CS301", marks: 41 }, { studentId: 3, course: "CS302", marks: 38 },
    { studentId: 4, course: "CS401", marks: 71 }, { studentId: 4, course: "CS302", marks: 66 },
    { studentId: 5, course: "CS301", marks: 55 }, { studentId: 5, course: "CS401", marks: 47 }
  ]
};

const routes = {
  "/api/users": { status: 200, body: data.users, delay: 120 },
  "/api/courses": { status: 200, body: data.courses, delay: 80 },
  "/api/results": { status: 200, body: data.results, delay: 150 },
  "/api/missing": { status: 404, body: { error: "not here" } },
  "/api/crash": { status: 500, body: { error: "server crashed" } },
  "/api/offline": { networkError: true },
  "/api/garbage": { status: 200, rawBody: "<html>Maintenance</html>" },
  "/api/slow": { status: 200, body: { done: true }, delay: 2000 }
};

async function tryCall(label, promise) {
  try {
    const value = await promise;
    const shown = Array.isArray(value) ? `${value.length} records, first: ${JSON.stringify(value[0])}` : JSON.stringify(value);
    console.log(`  ${label.padEnd(28)} OK   ${shown}`);
  } catch (err) {
    console.log(`  ${label.padEnd(28)} FAIL ${err.name}: ${err.message}`);
  }
}

console.log("TASK 8 - ASYNC API AGGREGATOR\n");

// --- concurrent dashboard ----------------------------------------------
const fakeFetch = createFakeFetch(routes);
let start = Date.now();
const loaded = await loadDashboardData(BASE, fakeFetch);
const concurrentMs = Date.now() - start;
const starts = fakeFetch.calls.map((c) => c.startedAt - fakeFetch.calls[0].startedAt);

console.log("Dashboard (Promise.all):");
console.log(buildDashboard(loaded));
console.log(`\n  the 3 requests started ${starts.join(" / ")} ms apart and took ${concurrentMs} ms in total`);

start = Date.now();
await getJSON(`${BASE}/users`, fakeFetch);
await getJSON(`${BASE}/courses`, fakeFetch);
await getJSON(`${BASE}/results`, fakeFetch);
console.log(`  one after another (sequential awaits) they take ${Date.now() - start} ms  (120 + 80 + 150)`);

// --- every kind of response ----------------------------------------------
console.log("\ngetJSON() with each simulated response:");
await tryCall("200 success", getJSON(`${BASE}/courses`, fakeFetch));
await tryCall("404 response", getJSON(`${BASE}/missing`, fakeFetch));
await tryCall("500 response", getJSON(`${BASE}/crash`, fakeFetch));
await tryCall("network failure", getJSON(`${BASE}/offline`, fakeFetch));
await tryCall("invalid JSON", getJSON(`${BASE}/garbage`, fakeFetch));

// --- timeout challenge ---------------------------------------------------
console.log("\nfetchWithTimeout() (AbortController + setTimeout/clearTimeout + try/finally):");
const withLimit = (ms) => (url) => fetchWithTimeout(url, ms, fakeFetch);
await tryCall("slow (2000 ms), limit 300", getJSON(`${BASE}/slow`, withLimit(300)));
await tryCall("slow (2000 ms), limit 3000", getJSON(`${BASE}/slow`, withLimit(3000)));
await tryCall("fast route, limit 300", getJSON(`${BASE}/courses`, withLimit(300)));

console.log("\nOne failing service fails the whole dashboard:");
const brokenFetch = createFakeFetch({ ...routes, "/api/results": { status: 503 } });
await tryCall("dashboard, results down", loadDashboardData(BASE, brokenFetch));

// if fetchWithTimeout left a timer running, Node would wait for it before exiting
console.log("\nAll timers were cleared in finally{}, so the program exits straight away.");
