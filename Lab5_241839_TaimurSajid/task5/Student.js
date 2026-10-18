// =====================================================================
// Task 5 - Student.js  (default export)
// Taimur Sajid (241839)
// =====================================================================
import { calculateAverage, calculateGPA, calculateGrade } from "./gradeUtils.js";

export default class Student {
  constructor(id, name, courses) {
    this.id = id;
    this.name = name;
    this.courses = courses.map(({ code, marks }) => ({ code, marks }));   // own copy
  }

  get marksList() {
    return this.courses.map((c) => c.marks);
  }

  get average() {
    return calculateAverage(this.marksList);
  }

  get gpa() {
    return calculateGPA(this.marksList);
  }

  toReportRow() {
    return {
      id: this.id,
      name: this.name,
      courses: this.courses.map((c) => ({ ...c, grade: calculateGrade(c.marks).letter })),
      average: this.average,
      gpa: this.gpa
    };
  }
}
