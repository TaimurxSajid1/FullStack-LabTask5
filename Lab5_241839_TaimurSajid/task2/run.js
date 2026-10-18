// Task 2 runner:  npm run task2
import { withGrades, meritList, departmentStats, queries, grade } from "./analytics.js";

const results = [
  { id: 1, name: "Ali", department: "CS", course: "FSWD", marks: 82 },
  { id: 2, name: "Sara", department: "CS", course: "FSWD", marks: 91 },
  { id: 3, name: "Usman", department: "SE", course: "FSWD", marks: 47 },
  { id: 4, name: "Hina", department: "AI", course: "FSWD", marks: 73 },
  { id: 5, name: "Ahmed", department: "SE", course: "FSWD", marks: 64 },
  { id: 6, name: "Zoya", department: "AI", course: "FSWD", marks: 91 }
];
const originalOrder = results.map((s) => s.name).join(",");

console.log("TASK 2 - PERFORMANCE ENGINE\n");

console.log("A) Results with grade, points and status");
console.table(withGrades(results), ["name", "department", "marks", "grade", "gradePoints", "status"]);

console.log("B) Merit list");
meritList(results).forEach((s, i) => console.log(`   ${i + 1}. ${s.name.padEnd(6)} ${s.marks}`));
console.log("   original array still in the same order:", results.map((s) => s.name).join(",") === originalOrder);

console.log("\nC) Department statistics");
console.log(departmentStats(results));
console.log("   with a new DS department added later:");
console.log(departmentStats([...results, { id: 7, name: "Rida", department: "DS", course: "FSWD", marks: 79 }]).DS);

console.log("\nD) Queries");
const q = queries(results);
console.log("   first student above 85 :", q.firstAbove85?.name);
console.log("   index of first failure :", q.firstFailIndex);
console.log("   anyone failed?         :", q.someoneFailed);
console.log("   all marks valid?       :", q.allMarksInRange);
console.log("   class average          :", q.average);
console.log("   above average          :", q.aboveAverage.join(", "));
console.log("   top three              :", q.topThree.join(", "));

console.log("\nBoundary grades:", [85, 84, 60, 59, 50, 49].map((m) => `${m}=${grade(m).letter}`).join("  "));

console.log("\nInvalid data:");
const messy = [...results, { id: 8, name: "Ghost", department: "CS", marks: 130 }, { id: 9, name: "Text", department: "SE", marks: "70" }];
console.log("   every() says all marks valid:", queries(messy).allMarksInRange);
console.log("   withGrades() keeps only valid rows:", withGrades(messy).length, "of", messy.length);
try {
  grade(-5);
} catch (e) {
  console.log(`   grade(-5) -> ${e.name}: ${e.message}`);
}
