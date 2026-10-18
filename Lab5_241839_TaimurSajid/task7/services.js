// =====================================================================
// Task 7 - Promise-Based Multi-Service Registration Engine
// Taimur Sajid (241839)
//
// Every service returns a Promise made with new Promise(resolve, reject)
// and a setTimeout to act like a network call.
// =====================================================================

export function makeCampus() {
  return {
    students: {
      101: { id: 101, name: "Ali", email: "ali@students.au.edu.pk", phone: "03001112233", passed: ["CS201", "CS301"] },
      102: { id: 102, name: "Sara", email: "sara@students.au.edu.pk", phone: null, passed: ["CS201", "CS301"] },
      103: { id: 103, name: "Hina", email: "hina@students.au.edu.pk", phone: "03214445566", passed: ["CS201"] },
      104: { id: 104, name: "Usman", email: "usman@students.au.edu.pk", phone: "03337778899", passed: ["CS201", "CS301"] }
    },
    courses: {
      CS401: { code: "CS401", title: "Web Engineering", needs: ["CS301"], seats: 2, enrolled: [] },
      CS402: { code: "CS402", title: "Cloud Computing", needs: ["CS301"], seats: 5, enrolled: [] }
    },
    auditOnline: true,
    auditLog: []
  };
}

export class RegistrationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "RegistrationError";
    this.code = code;
  }
}

// small helper: resolve or reject after `ms`
function respond(ms, work) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(work());
      } catch (err) {
        reject(err);
      }
    }, ms);
  });
}

// ---- registration services --------------------------------------------

export function getStudent(db, id) {
  return respond(30, () => {
    if (!Number.isInteger(id)) throw new TypeError(`student id must be a whole number, got ${JSON.stringify(id)}`);
    const student = db.students[id];
    if (!student) throw new RegistrationError("NO_STUDENT", `student ${id} not found`);
    return student;
  });
}

export function getCourse(db, code) {
  return respond(30, () => {
    const course = db.courses[code];
    if (!course) throw new RegistrationError("NO_COURSE", `course ${code} not found`);
    return course;
  });
}

export function checkPrerequisites(student, course) {
  return respond(20, () => {
    const missing = course.needs.filter((c) => !student.passed.includes(c));
    if (missing.length) throw new RegistrationError("PREREQUISITE", `${student.name} still needs ${missing.join(", ")}`);
    return { student, course };
  });
}

export function checkSeats({ student, course }) {
  return respond(20, () => {
    if (course.enrolled.includes(student.id)) throw new RegistrationError("ALREADY_REGISTERED", `${student.name} is already in ${course.code}`);
    if (course.enrolled.length >= course.seats) throw new RegistrationError("COURSE_FULL", `${course.code} has no seats left`);
    return { student, course };
  });
}

export function registerStudent({ student, course }) {
  return respond(30, () => {
    course.enrolled.push(student.id);
    return { studentId: student.id, name: student.name, email: student.email, phone: student.phone, course: course.code, status: "REGISTERED" };
  });
}

// ---- Part A: the registration chain -----------------------------------
// Each .then() RETURNS the next promise, so the chain waits for it and the
// value moves on to the next stage. One .catch() handles a failure at any stage.
export function registrationChain(db, studentId, courseCode) {
  let student;
  return getStudent(db, studentId)
    .then((s) => {
      student = s;
      return getCourse(db, courseCode);
    })
    .then((course) => checkPrerequisites(student, course))
    .then((pair) => checkSeats(pair))
    .then((pair) => registerStudent(pair));
}

// Same chain with ONE missing return. The .then() gives back undefined at
// once, so the next stage gets undefined instead of the course and the
// workflow breaks (and getCourse runs on its own, unwatched).
export function chainWithMissingReturn(db, studentId, courseCode) {
  let student;
  return getStudent(db, studentId)
    .then((s) => {
      student = s;
      getCourse(db, courseCode);          // <-- bug: no return
    })
    .then((course) => checkPrerequisites(student, course))
    .then((pair) => checkSeats(pair))
    .then((pair) => registerStudent(pair));
}

// ---- Part B: post-registration services --------------------------------

export function sendEmail(reg) {
  return respond(50, () => {
    if (!reg.email) throw new Error("no email address");
    return `email sent to ${reg.email}`;
  });
}

export function sendSMS(reg) {
  return respond(40, () => {
    if (!reg.phone) throw new Error("no phone number on record");
    return `SMS sent to ${reg.phone}`;
  });
}

export function writeAuditLog(db, reg) {
  return respond(25, () => {
    if (!db.auditOnline) throw new Error("audit server is offline");
    db.auditLog.push({ ...reg, at: new Date().toISOString() });
    return `audit entry #${db.auditLog.length}`;
  });
}

// Promise.allSettled: the three jobs are independent, and we need the result
// of EVERY one. Promise.all would stop at the first failure and hide the rest.
export function afterRegistration(db, reg) {
  const jobs = [
    ["Email", sendEmail(reg)],
    ["SMS", sendSMS(reg)],
    ["Audit", writeAuditLog(db, reg)]
  ];
  return Promise.allSettled(jobs.map(([, p]) => p)).then((outcomes) =>
    outcomes.map((o, i) => ({
      service: jobs[i][0],
      status: o.status,
      ...(o.status === "fulfilled" ? { detail: o.value } : { reason: o.reason.message })
    }))
  );
}

// ---- Part C: two course servers ----------------------------------------

export function courseServer(name, ms, works, code = "CS401") {
  return respond(ms, () => {
    if (!works) throw new Error(`${name} is down`);
    return { code, title: "Web Engineering", servedBy: name, ms };
  });
}

// Promise.any: takes the first server that SUCCEEDS and ignores failures,
// unless every server fails (then it rejects with an AggregateError).
// Promise.race would take the first server that SETTLES, so a fast failure
// would win and the registration would fail although a working copy was
// on the way. That is why race is not the right choice here.
export function fetchCourseFromAnyServer(servers) {
  return Promise.any(servers);
}
