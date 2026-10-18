// =====================================================================
// Task 5 - gradeUtils.js  (named exports only)
// Taimur Sajid (241839)
// =====================================================================

// [minimum marks, letter, grade points] from the top band down
export const GRADE_SCALE = [
  [85, "A", 4.0],
  [80, "A-", 3.7],
  [75, "B+", 3.3],
  [70, "B", 3.0],
  [65, "B-", 2.7],
  [60, "C+", 2.3],
  [55, "C", 2.0],
  [50, "D", 1.0],
  [0, "F", 0.0]
];

const round2 = (n) => Math.round(n * 100) / 100;

export function checkMarks(marks) {
  if (typeof marks !== "number" || Number.isNaN(marks)) throw new TypeError(`marks must be a number, got ${JSON.stringify(marks)}`);
  if (marks < 0 || marks > 100) throw new RangeError(`marks ${marks} are outside 0-100`);
  return marks;
}

export function calculateGrade(marks) {
  checkMarks(marks);
  const [, letter, points] = GRADE_SCALE.find(([min]) => marks >= min);
  return { letter, points };
}

export function calculateAverage(marksList) {
  if (!Array.isArray(marksList) || marksList.length === 0) throw new TypeError("need a non-empty list of marks");
  return round2(marksList.reduce((sum, m) => sum + checkMarks(m), 0) / marksList.length);
}

// GPA = average of the grade points of every course (all courses weigh the same)
export function calculateGPA(marksList) {
  if (!Array.isArray(marksList) || marksList.length === 0) throw new TypeError("need a non-empty list of marks");
  const totalPoints = marksList.reduce((sum, m) => sum + calculateGrade(m).points, 0);
  return round2(totalPoints / marksList.length);
}
