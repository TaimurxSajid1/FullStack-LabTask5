// Task 3 runner:  npm run task3
import { mergeProfile, mergeMany, profileCard, referenceReport } from "./profile.js";

const student = {
  id: 101,
  name: "Ali",
  marks: 0,
  scholarship: false,
  address: { city: "Islamabad", sector: "F-10" },
  contact: { email: "ali@university.edu" }
};
const update = {
  name: "Ali Khan",
  address: { city: "Rawalpindi" },
  contact: { phone: "03001234567" }
};

const snapshot = JSON.stringify(student);
const updated = mergeProfile(student, update);

console.log("TASK 3 - SAFE PROFILE UPDATE\n");
console.log("Updated student:", updated);
console.log("Original student:", student);
console.log("Original unchanged:", JSON.stringify(student) === snapshot);

console.log("\nReference challenge:");
referenceReport(student, updated).forEach((r) => console.log(`  ${r.pair}: ${r.sameReference ? "SAME" : "DIFFERENT"} - ${r.why}`));

const copy = { ...student };
console.log("\n  Why nested objects need their own spread:");
console.log("  const copy = { ...student }  ->  copy.address === student.address is", copy.address === student.address);
console.log("  (a one-level spread shares nested objects, so changing copy.address.city would also change the original)");

console.log("\nBoundary values 0, false and empty string are kept:");
console.log(mergeProfile(student, { marks: 0, scholarship: false, contact: { email: "" } }));

console.log("\nundefined means 'not sent', so the name is kept:");
console.log(mergeProfile(student, { name: undefined }).name);

console.log("\nSeveral updates using rest parameters:");
console.log(mergeMany(student, update, { marks: 76 }, { scholarship: true, address: { sector: "G-11" } }));

console.log("\nProfile card (nested destructuring, renaming, defaults, ?. and ??):");
console.log(profileCard(updated));

console.log("\nInvalid input:");
for (const bad of [[null, update], [student, "name=Ali"], [student, [1, 2]]]) {
  try {
    mergeProfile(...bad);
  } catch (e) {
    console.log(`  ${e.name}: ${e.message}`);
  }
}
