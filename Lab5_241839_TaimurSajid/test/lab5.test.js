// Automated checks for all eight tasks:  npm test
import { test } from "node:test";
import assert from "node:assert/strict";

import { decide, runAdmissions, DECISION } from "../task1/admissions.js";
import { grade, meritList, departmentStats, queries } from "../task2/analytics.js";
import { mergeProfile } from "../task3/profile.js";
import { Student as UniStudent, FacultyMember, Person } from "../task4/people.js";
import { processTranscript } from "../task5/transcriptService.js";
import { makeLegacyDb, registerForCourse } from "../task6/registrar.js";
import { makeCampus, registrationChain, afterRegistration, courseServer, fetchCourseFromAnyServer } from "../task7/services.js";
import { createFakeFetch } from "../task8/fakeFetch.js";
import { getJSON, fetchWithTimeout, loadDashboardData, buildDashboard, HttpError, NetworkError, InvalidJSONError, TimeoutError } from "../task8/aggregator.js";

const applicant = (over = {}) => ({
  id: "X1", name: "Test", age: "20", matricMarks: "90", intermediateMarks: "85", entryTest: "80", program: "BSCS", feePaid: "true", ...over
});

test("task 1: decisions and boundaries", () => {
  assert.equal(decide(applicant()).status, DECISION.SELECTED);
  assert.equal(decide(applicant({ feePaid: "false" })).status, DECISION.WAITING);
  assert.equal(decide(applicant({ intermediateMarks: "59" })).status, DECISION.REJECTED);
  assert.equal(decide(applicant({ age: "twenty" })).status, DECISION.INVALID);
  assert.equal(decide(applicant({ matricMarks: "0", intermediateMarks: "100", entryTest: "100" })).merit, 80);
  const input = [applicant()];
  const copy = JSON.stringify(input);
  runAdmissions(input);
  assert.equal(JSON.stringify(input), copy);
});

test("task 2: grades, ranking without mutation, stats", () => {
  assert.equal(grade(85).letter, "A");
  assert.equal(grade(49).letter, "F");
  const list = [{ name: "B", department: "CS", marks: 70 }, { name: "A", department: "CS", marks: 70 }, { name: "C", department: "SE", marks: 40 }];
  assert.deepEqual(meritList(list).map((s) => s.name), ["A", "B", "C"]);
  assert.equal(list[0].name, "B");
  assert.equal(departmentStats(list).CS.average, 70);
  assert.equal(queries(list).someoneFailed, true);
});

test("task 3: deep merge keeps the original and falsy values", () => {
  const s = { name: "Ali", marks: 0, address: { city: "Isb", sector: "F-10" }, contact: { email: "a@b.c" } };
  const u = mergeProfile(s, { address: { city: "Rwp" }, scholarship: false });
  assert.equal(s.address.city, "Isb");
  assert.deepEqual(u.address, { city: "Rwp", sector: "F-10" });
  assert.equal(u.marks, 0);
  assert.equal(u.scholarship, false);
  assert.notEqual(u.address, s.address);
});

test("task 4: inheritance, polymorphism and this", () => {
  const st = new UniStudent("Ali", "a@b.c", "1", 90);
  const fm = new FacultyMember("Dr X", "x@y.z", "F1", "CS");
  assert.ok(st instanceof Person && fm instanceof Person);
  assert.match(st.introduce(), /student/);
  assert.match(fm.introduce(), /faculty/);
  const detached = st.introduce;
  assert.throws(() => detached(), TypeError);
  assert.equal(detached.bind(st)(), st.introduce());
});

test("task 5: transcript validation and report", () => {
  const ok = processTranscript('[{"id":1,"name":"A","courses":[{"code":"C1","marks":90},{"code":"C2","marks":80}]}]');
  assert.equal(ok.report.students[0].average, 85);
  assert.deepEqual(JSON.parse(ok.json), ok.report);
  assert.throws(() => processTranscript("[{"), SyntaxError);
  assert.throws(() => processTranscript('[{"name":"A","courses":[{"code":"C","marks":1}]}]'), TypeError);
  assert.throws(() => processTranscript('[{"id":1,"name":"A","courses":[{"code":"C","marks":101}]}]'), RangeError);
  assert.throws(
    () => processTranscript('[{"id":1,"name":"A","courses":[{"code":"C","marks":1}]},{"id":1,"name":"B","courses":[{"code":"C","marks":1}]}]'),
    /duplicate/
  );
});

test("task 6: callback chain succeeds and stops on failure", (t, done) => {
  const db = makeLegacyDb();
  registerForCourse(db, 101, "CS401", (err, conf) => {
    assert.equal(err, null);
    assert.deepEqual(conf, { studentId: 101, course: "CS401", status: "REGISTERED" });
    registerForCourse(db, 102, "CS401", (err2) => {
      assert.equal(err2.code, "PREREQUISITE");
      done();
    });
  });
});

test("task 7: chain, allSettled report and Promise.any", async () => {
  const db = makeCampus();
  const reg = await registrationChain(db, 102, "CS401");
  const report = await afterRegistration(db, reg);
  assert.deepEqual(report.map((r) => r.status), ["fulfilled", "rejected", "fulfilled"]);
  await assert.rejects(registrationChain(db, 102, "CS401"), { code: "ALREADY_REGISTERED" });
  const c = await fetchCourseFromAnyServer([courseServer("A", 60, true), courseServer("B", 5, false)]);
  assert.equal(c.servedBy, "A");
});

test("task 8: getJSON errors, timeout and concurrent dashboard", async () => {
  const f = createFakeFetch({
    "/users": { body: [{ id: 1, name: "A", department: "CS" }], delay: 60 },
    "/courses": { body: [{ code: "C1" }], delay: 60 },
    "/results": { body: [{ studentId: 1, marks: 40 }], delay: 60 },
    "/e404": { status: 404 },
    "/net": { networkError: true },
    "/bad": { rawBody: "{oops" },
    "/slow": { body: 1, delay: 500 }
  });
  await assert.rejects(getJSON("http://x/e404", f), HttpError);
  await assert.rejects(getJSON("http://x/net", f), NetworkError);
  await assert.rejects(getJSON("http://x/bad", f), InvalidJSONError);
  await assert.rejects(getJSON("http://x/slow", (u) => fetchWithTimeout(u, 50, f)), TimeoutError);

  const start = Date.now();
  const dash = buildDashboard(await loadDashboardData("http://x", f));
  assert.ok(Date.now() - start < 150, "the three requests should run at the same time");
  assert.equal(dash.failedStudents, 1);
  assert.equal(dash.totalCourses, 1);
});
