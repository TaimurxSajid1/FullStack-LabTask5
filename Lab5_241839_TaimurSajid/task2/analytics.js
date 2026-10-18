// =====================================================================
// Task 2 - Academic Performance Intelligence Engine
// Taimur Sajid (241839)
//
// All main operations use array methods. sort() changes the array it is
// called on, so ranking always sorts a COPY ([...list]) and the original
// results array is never modified.
// =====================================================================

const PASS = 50;
const twoDecimals = (n) => Math.round(n * 100) / 100;

// Grading policy (if / else if chain)
export function grade(marks) {
  if (typeof marks !== "number" || marks < 0 || marks > 100 || Number.isNaN(marks)) {
    throw new RangeError(`marks must be 0-100, got ${marks}`);
  }
  if (marks >= 85) return { letter: "A", points: 4.0 };
  if (marks >= 80) return { letter: "A-", points: 3.7 };
  if (marks >= 75) return { letter: "B+", points: 3.3 };
  if (marks >= 70) return { letter: "B", points: 3.0 };
  if (marks >= 65) return { letter: "B-", points: 2.7 };
  if (marks >= 60) return { letter: "C+", points: 2.3 };
  if (marks >= 50) return { letter: "C", points: 2.0 };
  return { letter: "F", points: 0.0 };
}

export const hasValidMarks = (s) => typeof s?.marks === "number" && s.marks >= 0 && s.marks <= 100;

// A. result processing - map() builds new objects
export function withGrades(results) {
  return results.filter(hasValidMarks).map((s) => {
    const { letter, points } = grade(s.marks);
    return { ...s, grade: letter, gradePoints: points, status: s.marks >= PASS ? "Pass" : "Fail" };
  });
}

// B. ranked merit list - copy first, then sort (marks desc, name asc)
export function meritList(results) {
  return [...results].sort((a, b) => {
    if (b.marks !== a.marks) return b.marks - a.marks;
    return a.name.localeCompare(b.name);
  });
}

// C. department statistics - reduce() into an object, works for any department
export function departmentStats(results) {
  const grouped = results.reduce((acc, s) => {
    acc[s.department] ??= [];
    acc[s.department].push(s.marks);
    return acc;
  }, {});

  const stats = {};
  Object.entries(grouped).forEach(([dept, marks]) => {
    stats[dept] = {
      students: marks.length,
      average: twoDecimals(marks.reduce((a, b) => a + b, 0) / marks.length),
      highest: Math.max(...marks),
      passed: marks.filter((m) => m >= PASS).length
    };
  });
  return stats;
}

// D. academic queries
export function queries(results) {
  const average = results.length ? twoDecimals(results.reduce((t, s) => t + s.marks, 0) / results.length) : 0;
  return {
    firstAbove85: results.find((s) => s.marks > 85),
    firstFailIndex: results.findIndex((s) => s.marks < PASS),
    someoneFailed: results.some((s) => s.marks < PASS),
    allMarksInRange: results.every(hasValidMarks),
    average,
    aboveAverage: results.filter((s) => s.marks > average).map((s) => s.name),
    topThree: meritList(results).slice(0, 3).map((s) => s.name)
  };
}
