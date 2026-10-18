// Task 1 runner:  npm run task1
import { runAdmissions, admissionSummary } from "./admissions.js";

const applicants = [
  // example from the lab manual
  { id: "A101", name: "Sara Khan", age: "19", matricMarks: "91", intermediateMarks: "87", entryTest: "78", program: "BSCS", feePaid: "true" },
  { id: "A102", name: "Ahmed Ali", age: "twenty", matricMarks: "88", intermediateMarks: "", entryTest: "72", program: "BSSE", feePaid: "false" },
  { id: "A103", name: "Hassan", age: "18", matricMarks: "76", intermediateMarks: "83", entryTest: "91", program: "BSAI", feePaid: "true" },

  // normal cases
  { id: "B201", name: "Mahnoor Iqbal", age: "21", matricMarks: "70", intermediateMarks: "74", entryTest: "76", program: "BSIT", feePaid: "true" },  // WAITING (merit < 80)
  { id: "B202", name: "Danish Raza", age: "20", matricMarks: "92", intermediateMarks: "90", entryTest: "88", program: "bscs", feePaid: "false" }, // WAITING (fee)
  { id: "B203", name: "Iqra Javed", age: "22", matricMarks: "95", intermediateMarks: "58", entryTest: "90", program: "BSSE", feePaid: "true" },  // REJECTED (inter < 60)

  // boundary cases
  { id: "C301", name: "Zain Ul Abideen", age: "17", matricMarks: "100", intermediateMarks: "60", entryTest: "64", program: "BSAI", feePaid: "true" }, // merit exactly 70
  { id: "C302", name: "Areeba Shah", age: "30", matricMarks: "100", intermediateMarks: "100", entryTest: "60", program: "BSCS", feePaid: "true" },  // merit exactly 80 -> SELECTED
  { id: "C303", name: "Fahad Mir", age: "25", matricMarks: "0", intermediateMarks: "100", entryTest: "100", program: "BSIT", feePaid: "true" },     // matric 0 is a real value

  // invalid cases
  { id: "D401", name: "Hamid", age: "31", matricMarks: "105", intermediateMarks: "80", entryTest: "70", program: "MBBS", feePaid: "yes" },
  { id: "", name: "   ", age: "19.5", matricMarks: "8O", intermediateMarks: "80", entryTest: "70", program: "BSCS", feePaid: "true" },
  "not an object"
];

const before = JSON.stringify(applicants);
const decisions = runAdmissions(applicants);

console.log("TASK 1 - ADMISSIONS\n");
decisions.forEach((d) => {
  const merit = d.merit === null ? "--" : d.merit.toFixed(2);
  console.log(`${d.applicantId.padEnd(5)} ${d.applicantName.padEnd(16)} ${d.program.padEnd(5)} merit ${merit.padStart(6)}  ${d.status}`);
  console.log(`      ${d.remarks.join("; ")}`);
});

console.log("\nSUMMARY");
console.log(admissionSummary(decisions));
console.log("\nInput left unchanged:", JSON.stringify(applicants) === before);
