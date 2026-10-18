// =====================================================================
// Task 6 - Legacy Course Registration Service (callbacks only)
// Taimur Sajid (241839)
//
//   Load Student -> Check Prerequisites -> Check Available Seats -> Register Course
//
// Every step is asynchronous (setTimeout) and uses the error-first style:
//     callback(error, value)
// No Promises and no async/await anywhere in this file.
// =====================================================================

const STEP_DELAY_MS = 40;

// Fresh, separate data every time so runs do not affect each other
export function makeLegacyDb() {
  return {
    students: {
      101: { id: 101, name: "Ali", passed: ["CS201", "CS301"] },
      102: { id: 102, name: "Sara", passed: ["CS201"] },
      103: { id: 103, name: "Hina", passed: ["CS201", "CS301"] },
      104: { id: 104, name: "Usman", passed: ["CS201", "CS301", "MT101"] }
    },
    courses: {
      CS401: { code: "CS401", title: "Web Engineering", needs: ["CS301"], seats: 3, enrolled: [] },
      CS402: { code: "CS402", title: "Cloud Computing", needs: ["CS301"], seats: 1, enrolled: [103] },
      MT201: { code: "MT201", title: "Linear Algebra", needs: [], seats: 40, enrolled: [] }
    }
  };
}

// Makes sure a callback can only ever run ONE time.
// A second call is ignored and reported, so a bug cannot run the next step twice.
function callOnce(callback, stepName) {
  let called = false;
  return function (error, value) {
    if (called) {
      console.warn(`  [warning] ${stepName} tried to call its callback twice - ignored`);
      return;
    }
    called = true;
    callback(error, value);
  };
}

function fail(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

// Runs `work` after a delay. If work() throws, the error goes to the callback
// instead of crashing the program (a throw inside setTimeout cannot be caught
// by a try/catch around the original call).
function later(stepName, callback, work) {
  const done = callOnce(callback, stepName);
  setTimeout(function () {
    let value;
    try {
      value = work();
    } catch (err) {
      done(err);
      return;
    }
    done(null, value);
  }, STEP_DELAY_MS);
}

// ---- the four asynchronous operations --------------------------------

export function loadStudent(db, studentId, callback) {
  later("loadStudent", callback, function () {
    if (!Number.isInteger(studentId)) throw fail("BAD_INPUT", `student id must be a whole number, got ${JSON.stringify(studentId)}`);
    const student = db.students[studentId];
    if (!student) throw fail("NO_STUDENT", `student ${studentId} does not exist`);
    return student;
  });
}

export function checkPrerequisites(db, student, courseCode, callback) {
  later("checkPrerequisites", callback, function () {
    const course = db.courses[courseCode];
    if (!course) throw fail("NO_COURSE", `course ${courseCode} does not exist`);
    const missing = course.needs.filter((c) => !student.passed.includes(c));
    if (missing.length > 0) throw fail("PREREQUISITE", `${student.name} has not completed ${missing.join(", ")}`);
    return course;
  });
}

export function checkSeats(db, student, course, callback) {
  later("checkSeats", callback, function () {
    // checked before "full", so a registered student gets the more useful message
    if (course.enrolled.includes(student.id)) throw fail("ALREADY_REGISTERED", `${student.name} is already registered in ${course.code}`);
    if (course.enrolled.length >= course.seats) throw fail("COURSE_FULL", `${course.code} is full (${course.enrolled.length}/${course.seats})`);
    return course.seats - course.enrolled.length;
  });
}

export function registerCourse(db, student, course, callback) {
  later("registerCourse", callback, function () {
    if (course.enrolled.includes(student.id)) throw fail("ALREADY_REGISTERED", `${student.name} is already registered in ${course.code}`);
    course.enrolled.push(student.id);
    return { studentId: student.id, course: course.code, status: "REGISTERED" };
  });
}

// ---- the dependent workflow ------------------------------------------
// Each step needs the result of the step before it, so each one is called
// INSIDE the previous callback. Every level checks `if (err)` and returns,
// which stops the chain immediately at the first failure.
export function registerForCourse(db, studentId, courseCode, done) {
  loadStudent(db, studentId, function (err, student) {
    if (err) return done(err);

    checkPrerequisites(db, student, courseCode, function (err, course) {
      if (err) return done(err);

      checkSeats(db, student, course, function (err) {
        if (err) return done(err);

        registerCourse(db, student, course, function (err, confirmation) {
          if (err) return done(err);
          done(null, confirmation);
        });
      });
    });
  });
}

// ---- Why this style becomes hard to maintain --------------------------
// 1. Nesting: every dependent step adds one more level of indentation
//    ("callback hell" / pyramid of doom). With 4 steps it is readable; with
//    10 steps (fees, hostel, email, audit ...) the code drifts to the right,
//    and adding, removing or reordering a step means moving whole blocks.
// 2. Error handling is repeated: `if (err) return done(err);` must be written
//    at EVERY level. Forgetting one line (or the `return`) means the chain
//    keeps running after a failure, or `done` is called twice.
// 3. try/catch does not work across the asynchronous boundary: an exception
//    thrown inside setTimeout is not caught by a try/catch around
//    registerForCourse(). Each step has to catch its own errors and pass them
//    to the callback by hand (that is what later() does above).
// 4. Nothing guarantees "exactly once": the language does not stop a function
//    from calling its callback twice or never. We had to add callOnce().
// Promises (Task 7) solve these: one .catch() for the whole chain, a flat
// .then() list instead of nesting, and a promise can only settle once.
