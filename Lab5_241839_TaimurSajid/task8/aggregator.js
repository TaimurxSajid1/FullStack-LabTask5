// =====================================================================
// Task 8 - Concurrent Academic API Aggregator (async/await)
// Taimur Sajid (241839)
// =====================================================================

// One error class per kind of failure, so the caller can tell them apart
export class HttpError extends Error {
  constructor(url, status, statusText) {
    super(`HTTP ${status} ${statusText} for ${url}`);
    this.name = "HttpError";
    this.status = status;
  }
}
export class NetworkError extends Error {
  constructor(url, cause) {
    super(`network failure for ${url} (${cause.message})`, { cause });
    this.name = "NetworkError";
  }
}
export class InvalidJSONError extends Error {
  constructor(url, cause) {
    super(`invalid JSON from ${url} (${cause.message})`, { cause });
    this.name = "InvalidJSONError";
  }
}
export class TimeoutError extends Error {
  constructor(url, ms) {
    super(`no response from ${url} within ${ms} ms`);
    this.name = "TimeoutError";
  }
}

// 1. call fetch   2. check response.ok   3. throw on bad status
// 4. parse JSON   5. pass on network / JSON / timeout failures
export async function getJSON(url, fetchImplementation = globalThis.fetch) {
  let response;
  try {
    response = await fetchImplementation(url);
  } catch (err) {
    if (err instanceof TimeoutError) throw err;          // already explained
    throw new NetworkError(url, err);
  }

  if (!response.ok) throw new HttpError(url, response.status, response.statusText);

  try {
    return await response.json();
  } catch (err) {
    throw new InvalidJSONError(url, err);
  }
}

// AbortController cancels the request when the timer fires.
// finally{} clears the timer on success AND on failure, so no timer is left running.
export async function fetchWithTimeout(url, milliseconds, fetchImplementation = globalThis.fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), milliseconds);
  try {
    return await fetchImplementation(url, { signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") throw new TimeoutError(url, milliseconds);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// The three calls do not depend on each other, so they are STARTED together
// and awaited together with Promise.all (one failure fails the dashboard,
// because the statistics cannot be built without all three lists).
export async function loadDashboardData(baseUrl, fetchImplementation) {
  const [users, courses, results] = await Promise.all([
    getJSON(`${baseUrl}/users`, fetchImplementation),
    getJSON(`${baseUrl}/courses`, fetchImplementation),
    getJSON(`${baseUrl}/results`, fetchImplementation)
  ]);
  return { users, courses, results };
}

const round2 = (n) => Math.round(n * 100) / 100;
const PASS_MARK = 50;

export function buildDashboard({ users, courses, results }) {
  if (![users, courses, results].every(Array.isArray)) throw new TypeError("users, courses and results must all be arrays");

  // each student's own average
  const perStudent = users.map((u) => {
    const marks = results.filter((r) => r.studentId === u.id).map((r) => r.marks);
    const average = marks.length ? round2(marks.reduce((a, b) => a + b, 0) / marks.length) : null;
    return { ...u, average };
  });
  const graded = perStudent.filter((s) => s.average !== null);

  const allMarks = results.map((r) => r.marks);
  const top = graded.reduce((best, s) => (!best || s.average > best.average ? s : best), null);

  const departments = {};
  for (const s of graded) {
    const d = (departments[s.department] ??= { students: 0, total: 0, failed: 0 });
    d.students += 1;
    d.total += s.average;
    if (s.average < PASS_MARK) d.failed += 1;
  }
  for (const [name, d] of Object.entries(departments)) {
    departments[name] = { students: d.students, averageMarks: round2(d.total / d.students), failed: d.failed };
  }

  return {
    totalStudents: users.length,
    totalCourses: courses.length,
    overallAverageMarks: allMarks.length ? round2(allMarks.reduce((a, b) => a + b, 0) / allMarks.length) : null,
    highestPerformingStudent: top ? { id: top.id, name: top.name, average: top.average } : null,
    failedStudents: graded.filter((s) => s.average < PASS_MARK).length,
    departmentStats: departments
  };
}
