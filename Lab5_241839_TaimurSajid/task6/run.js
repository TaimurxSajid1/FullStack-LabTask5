// Task 6 runner:  npm run task6
// The attempts are run one after another with callbacks too (no Promises).
import { makeLegacyDb, registerForCourse } from "./registrar.js";

const db = makeLegacyDb();

const attempts = [
  ["Ali -> CS401 (should succeed)", 101, "CS401"],
  ["Hina -> CS401 (should succeed)", 103, "CS401"],
  ["student 999 does not exist", 999, "CS401"],
  ["Sara has not passed CS301", 102, "CS401"],
  ["CS402 has 1 seat and it is taken", 101, "CS402"],
  ["Ali again -> CS401 (already registered)", 101, "CS401"],
  ["Usman takes the LAST CS401 seat (3/3)", 104, "CS401"],
  ["Sara -> MT201 (no prerequisites)", 102, "MT201"],
  ["unknown course", 101, "PH999"],
  ["id sent as text", "101", "CS401"]
];

function next(index) {
  if (index === attempts.length) {
    console.log("\nCS401 enrolled:", db.courses.CS401.enrolled, `(${db.courses.CS401.enrolled.length}/${db.courses.CS401.seats})`);
    return;
  }
  const [label, studentId, courseCode] = attempts[index];
  const started = Date.now();

  registerForCourse(db, studentId, courseCode, function (err, confirmation) {
    const ms = Date.now() - started;
    if (err) {
      console.log(`x ${label}\n    stopped: ${err.code} - ${err.message}  (${ms} ms)`);
    } else {
      console.log(`v ${label}\n    `, confirmation, ` (${ms} ms)`);
    }
    next(index + 1);
  });
}

console.log("TASK 6 - CALLBACK REGISTRATION\n");
console.log("A failure stops the chain at once: a successful run takes 4 steps, early failures take fewer.\n");
next(0);
