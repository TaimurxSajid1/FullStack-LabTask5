// Task 7 runner:  npm run task7
import {
  makeCampus,
  registrationChain,
  chainWithMissingReturn,
  afterRegistration,
  courseServer,
  fetchCourseFromAnyServer
} from "./services.js";

const db = makeCampus();

// Part A + B together: register, then run the three post-registration jobs
function attempt(label, studentId, courseCode) {
  console.log(`\n> ${label}`);
  return registrationChain(db, studentId, courseCode)
    .then((reg) => {
      console.log("  registered:", { studentId: reg.studentId, course: reg.course, status: reg.status });
      return afterRegistration(db, reg);
    })
    .then((report) =>
      report.forEach((r) => console.log(`    { service: '${r.service}', status: '${r.status}' }`.padEnd(48) + `${r.detail ?? r.reason}`))
    )
    .catch((err) => console.log(`  failed -> ${err.name}${err.code ? ` [${err.code}]` : ""}: ${err.message}`))
    .finally(() => console.log(`  (done; CS401 seats used ${db.courses.CS401.enrolled.length}/${db.courses.CS401.seats})`));
}

console.log("TASK 7 - PROMISE REGISTRATION ENGINE");
console.log("\n=== Part A: chain   Part B: Promise.allSettled ===");

attempt("Ali -> CS401 (all three services work)", 101, "CS401")
  .then(() => attempt("Sara -> CS401 (no phone, so SMS is rejected)", 102, "CS401"))
  .then(() => attempt("Usman -> CS401 (2 seats, both taken)", 104, "CS401"))
  .then(() => attempt("Ali -> CS401 again", 101, "CS401"))
  .then(() => attempt("Hina -> CS402 (missing CS301)", 103, "CS402"))
  .then(() => {
    db.auditOnline = false;
    return attempt("Usman -> CS402 while the audit server is offline", 104, "CS402");
  })
  .then(() => attempt("student 500 does not exist", 500, "CS401"))
  .then(() => attempt("course XY100 does not exist", 101, "XY100"))
  .then(() => attempt("id given as text", "101", "CS401"))

  .then(() => {
    console.log("\n=== Part A: the same chain with a missing return ===");
    return chainWithMissingReturn(makeCampus(), 101, "CS401")
      .then((r) => console.log("  unexpected success", r))
      .catch((err) => console.log(`  broken -> ${err.name}: ${err.message}`));
  })

  .then(() => {
    console.log("\n=== Part C: two course servers, Promise.any ===");
    return fetchCourseFromAnyServer([courseServer("Server A", 120, true), courseServer("Server B", 60, true)])
      .then((c) => console.log("  both up        -> served by", c.servedBy, `(${c.ms} ms, the faster one)`));
  })
  .then(() =>
    fetchCourseFromAnyServer([courseServer("Server A", 120, true), courseServer("Server B", 20, false)])
      .then((c) => console.log("  B fails fast   -> served by", c.servedBy, "(the failure was ignored)"))
  )
  .then(() =>
    // for comparison only: race settles with whatever finishes first, even a failure
    Promise.race([courseServer("Server A", 120, true), courseServer("Server B", 20, false)])
      .then((c) => console.log("  race would give", c.servedBy))
      .catch((err) => console.log(`  Promise.race with the same servers -> rejected: ${err.message} (wrong choice here)`))
  )
  .then(() =>
    fetchCourseFromAnyServer([courseServer("Server A", 30, false), courseServer("Server B", 50, false)])
      .catch((err) => console.log(`  both down      -> ${err.name}: ${err.errors.map((e) => e.message).join(" + ")}`))
  )
  .finally(() => console.log("\nAudit log entries:", db.auditLog.map((e) => `${e.studentId}:${e.course}`).join(", ")));
