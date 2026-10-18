// =====================================================================
// Task 5 - main.js  (the caller)
// Taimur Sajid (241839)
//
// default import : Student
// named imports  : processTranscript, parseTranscriptJSON
// alias          : calculateGrade as gradeFor, calculateGPA as gpaOf
// =====================================================================
import Student from "./Student.js";
import { processTranscript, parseTranscriptJSON } from "./transcriptService.js";
import { calculateGrade as gradeFor, calculateGPA as gpaOf } from "./gradeUtils.js";

const rawData = `
[
  {
    "id": 101,
    "name": "Ali",
    "courses": [
      { "code": "CS301", "marks": 81 },
      { "code": "CS302", "marks": 74 }
    ]
  },
  {
    "id": 102,
    "name": "Sara",
    "courses": [
      { "code": "CS301", "marks": 93 },
      { "code": "CS302", "marks": 88 },
      { "code": "MT201", "marks": 79 }
    ]
  },
  {
    "id": 103,
    "name": "Usman",
    "courses": [
      { "code": "CS301", "marks": 0 },
      { "code": "CS302", "marks": 100 }
    ]
  }
]`;

const badInputs = [
  ["malformed JSON (missing bracket)", `[ { "id": 101, "name": "Ali", "courses": [] }`],
  ["missing student id", `[ { "name": "Ali", "courses": [ { "code": "CS301", "marks": 81 } ] } ]`],
  ["duplicate id", `[ { "id": 7, "name": "A", "courses": [ { "code": "CS1", "marks": 70 } ] },
                     { "id": 7, "name": "B", "courses": [ { "code": "CS1", "marks": 60 } ] } ]`],
  ["marks above 100", `[ { "id": 1, "name": "A", "courses": [ { "code": "CS1", "marks": 120 } ] } ]`],
  ["marks below 0", `[ { "id": 1, "name": "A", "courses": [ { "code": "CS1", "marks": -4 } ] } ]`],
  ["missing course code", `[ { "id": 1, "name": "A", "courses": [ { "marks": 55 } ] } ]`],
  ["marks sent as text", `[ { "id": 1, "name": "A", "courses": [ { "code": "CS1", "marks": "80" } ] } ]`],
  ["not an array", `{ "id": 1 }`]
];

function run(label, text) {
  console.log(`\n--- ${label} ---`);
  let ok = false;
  try {
    const { report, json } = processTranscript(text);
    ok = true;
    console.log("report object:", report.totalStudents, "students, class average", report.classAverage, "| top:", report.topStudent);
    console.log("report as JSON:\n" + json);
    console.log("JSON round trip works:", JSON.stringify(JSON.parse(json)) === JSON.stringify(report));
  } catch (err) {
    console.log(`rejected -> ${err.name}: ${err.message}`);
  } finally {
    // runs on success AND on failure
    console.log(`finally: finished "${label}" (${ok ? "accepted" : "rejected"})`);
  }
}

console.log("TASK 5 - MODULAR TRANSCRIPT PROCESSING");
run("valid transcript", rawData);
badInputs.forEach(([label, text]) => run(label, text));

console.log("\n--- using the modules directly ---");
const ali = new Student(101, "Ali", parseTranscriptJSON(rawData)[0].courses);
console.log(`${ali.name}: average ${ali.average}, GPA ${ali.gpa}`);
console.log("gradeFor(81):", gradeFor(81), "| gpaOf([81, 74]):", gpaOf([81, 74]));
