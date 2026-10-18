// Task 4 runner:  npm run task4
import { Person, Student, FacultyMember, kindOf } from "./people.js";

console.log("TASK 4 - USER HIERARCHY AND THIS\n");

const users = [
  new Student("Taimur Sajid", "taimur@students.au.edu.pk", "241839", 81),
  new FacultyMember("Dr Waqas Abbasi", "waqas@au.edu.pk", "F-118", "Mathematics"),
  new Student("Noor Fatima", "noor@students.au.edu.pk", "241850", 44),
  new FacultyMember("Ms Maryam Wardah", "maryam@au.edu.pk", "F-204", "Computer Science"),
  new Student("Bilal Hassan", "bilal@students.au.edu.pk", "241812", 92)
];

console.log("users.forEach(user => console.log(user.introduce())):");
users.forEach((user) => console.log("  " + user.introduce()));

console.log("\nRuntime polymorphism + instanceof:");
users.forEach((u) => console.log(`  ${u.name.padEnd(18)} ${kindOf(u).padEnd(14)} Person? ${u instanceof Person}`));

console.log("\ngetResult():");
users.filter((u) => u instanceof Student).forEach((s) => console.log("  " + s.getResult()));

console.log("\nnew + prototype link:");
const student = users[0];
console.log("  Object.getPrototypeOf(student) === Student.prototype:", Object.getPrototypeOf(student) === Student.prototype);
console.log("  Student extends Person:", Object.getPrototypeOf(Student.prototype) === Person.prototype);

console.log("\ncall(): Person's introduce with the guest object as `this`");
const guest = { name: "Dr. Ahmed", email: "ahmed@example.com" };
console.log("  " + Person.prototype.introduce.call(guest));

console.log("\nDetached method:");
const fn = student.introduce;
try {
  fn();
} catch (err) {
  console.log(`  fn() -> ${err.name}: ${err.message}`);
  console.log("  Reason: `this` is decided by HOW a function is called. student.introduce() has student");
  console.log("  before the dot, so this = student. fn() has nothing before the dot, and class code runs in");
  console.log("  strict mode, so this = undefined and this.name cannot be read.");
}

console.log("\nbind(): permanently ties `this` to the student");
const safeIntroduce = student.introduce.bind(student);
console.log("  " + safeIntroduce());
const takesCallback = (callback) => callback();      // a method passed somewhere else
console.log("  passed as a callback: " + takesCallback(safeIntroduce));

console.log("\nInvalid objects are refused:");
for (const make of [() => new Student("X", "x@y.com", "1", 120), () => new FacultyMember("Y", "nope", "F-1", "CS"), () => Person("Z", "z@z.com")]) {
  try {
    make();
  } catch (e) {
    console.log(`  ${e.name}: ${e.message}`);
  }
}
