// =====================================================================
// Task 5 - transcriptService.js
// Taimur Sajid (241839)
//
// JSON text  ->  parse safely  ->  validate every record  ->  Student objects
//            ->  report object  ->  JSON text again
//
// Error types used:
//   SyntaxError  the text is not valid JSON
//   TypeError    a value has the wrong type or is missing (id, name, code ...)
//   RangeError   a value has the right type but is not allowed (marks 120)
//   Error        a rule about the whole file is broken (duplicate id)
// Every message says where the problem is, e.g. "students[1].courses[0].marks".
// =====================================================================
import Student from "./Student.js";
import { checkMarks, calculateAverage as averageOf } from "./gradeUtils.js";

export function parseTranscriptJSON(text) {
  if (typeof text !== "string") throw new TypeError("transcript data must be a JSON string");
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    // keep the original error as the cause
    throw new SyntaxError(`malformed transcript JSON (${err.message})`, { cause: err });
  }
  if (!Array.isArray(data)) throw new TypeError("transcript JSON must be an array of students");
  return data;
}

function validateCourse(course, where) {
  if (typeof course !== "object" || course === null) throw new TypeError(`${where} is not an object`);
  if (typeof course.code !== "string" || course.code.trim() === "") throw new TypeError(`${where}.code is missing`);
  try {
    checkMarks(course.marks);
  } catch (err) {
    // same error type (TypeError / RangeError), but with the location added
    throw new err.constructor(`${where}.marks: ${err.message}`);
  }
}

export function toStudents(records) {
  const seenIds = new Set();

  return records.map((record, i) => {
    const where = `students[${i}]`;
    if (typeof record !== "object" || record === null) throw new TypeError(`${where} is not an object`);

    const { id, name, courses } = record;
    if (id === undefined || id === null || id === "") throw new TypeError(`${where}.id is missing`);
    if (!Number.isInteger(id) || id <= 0) throw new TypeError(`${where}.id must be a positive whole number, got ${JSON.stringify(id)}`);
    if (seenIds.has(id)) throw new Error(`${where}.id ${id} is a duplicate`);
    seenIds.add(id);

    if (typeof name !== "string" || name.trim() === "") throw new TypeError(`${where}.name is missing`);
    if (!Array.isArray(courses) || courses.length === 0) throw new TypeError(`${where}.courses must be a non-empty array`);
    courses.forEach((course, j) => validateCourse(course, `${where}.courses[${j}]`));

    return new Student(id, name.trim(), courses);
  });
}

export function buildReport(students) {
  const rows = students.map((s) => s.toReportRow());
  const best = rows.reduce((top, r) => (top === null || r.gpa > top.gpa ? r : top), null);
  return {
    title: "CampusFlow Transcript Report",
    totalStudents: rows.length,
    classAverage: rows.length ? averageOf(rows.map((r) => r.average)) : null,
    topStudent: best ? { id: best.id, name: best.name, gpa: best.gpa } : null,
    students: rows
  };
}

// the full pipeline: text in, { report, json } out
export function processTranscript(text) {
  const students = toStudents(parseTranscriptJSON(text));
  const report = buildReport(students);
  return { report, json: JSON.stringify(report, null, 2) };
}
