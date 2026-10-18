// =====================================================================
// Task 1 - Admission Decision and Data Sanitization Engine
// Taimur Sajid (241839)
//
// Every applicant goes through:  clean -> validate -> merit -> decision
//
// Merit  = 20% matric + 30% intermediate + 50% entry test
// Eligible when merit >= 70, entry test >= 60 and intermediate >= 60
//
// My rule for SELECTED vs WAITING:
//   SELECTED  eligible, merit >= 80 and the fee has been paid
//   WAITING   eligible but merit is between 70 and 79.99, OR the fee is unpaid
//   REJECTED  data is fine but the applicant is not eligible
//   INVALID DATA  something is missing, not a number, out of range or unsupported
// =====================================================================

export const DECISION = Object.freeze({
  SELECTED: "SELECTED",
  WAITING: "WAITING",
  REJECTED: "REJECTED",
  INVALID: "INVALID DATA"
});

export const SELECTION_MERIT = 80;
const MIN = { merit: 70, entryTest: 60, intermediate: 60 };

// switch: maps a program code to its full name; unknown codes give null
export function programName(code) {
  switch (code) {
    case "BSCS": return "Computer Science";
    case "BSSE": return "Software Engineering";
    case "BSAI": return "Artificial Intelligence";
    case "BSIT": return "Information Technology";
    default: return null;
  }
}

// "" , "   ", null and undefined are blank. 0 and "0" are NOT blank,
// which is why a falsy check like !value cannot be used here.
const isBlank = (value) => value === null || value === undefined || String(value).trim() === "";

// Explicit conversion with Number(); reports blanks and NaN separately
export function readNumber(raw, label, problems) {
  if (isBlank(raw)) {
    problems.push(`${label} is missing`);
    return null;
  }
  const value = Number(String(raw).trim());
  if (Number.isNaN(value)) {
    problems.push(`${label} "${raw}" is not a number`);
    return null;
  }
  return value;
}

// "true"/"false" must be compared as text: Boolean("false") would be true
export function readFlag(raw, label, problems) {
  if (raw === true || raw === false) return raw;
  const text = isBlank(raw) ? "" : String(raw).trim().toLowerCase();
  if (text === "true") return true;
  if (text === "false") return false;
  problems.push(`${label} must be "true" or "false"`);
  return null;
}

export function cleanApplicant(raw) {
  const problems = [];
  if (typeof raw !== "object" || raw === null) {
    return { problems: ["record is not an object"], clean: {} };
  }

  const clean = {
    id: isBlank(raw.id) ? null : String(raw.id).trim(),
    name: isBlank(raw.name) ? null : String(raw.name).trim(),
    program: isBlank(raw.program) ? null : String(raw.program).trim().toUpperCase(),
    age: readNumber(raw.age, "age", problems),
    matric: readNumber(raw.matricMarks, "matric marks", problems),
    inter: readNumber(raw.intermediateMarks, "intermediate marks", problems),
    test: readNumber(raw.entryTest, "entry test", problems),
    feePaid: readFlag(raw.feePaid, "feePaid", problems)
  };

  if (!clean.id) problems.push("id is missing");
  if (!clean.name) problems.push("name is missing");
  if (!clean.program) problems.push("program is missing");
  else if (programName(clean.program) === null) problems.push(`program ${clean.program} is not offered`);

  if (clean.age !== null && (!Number.isInteger(clean.age) || clean.age < 17 || clean.age > 30)) {
    problems.push(`age ${clean.age} must be a whole number from 17 to 30`);
  }
  for (const [label, mark] of [["matric", clean.matric], ["intermediate", clean.inter], ["entry test", clean.test]]) {
    if (mark !== null && (mark < 0 || mark > 100)) problems.push(`${label} ${mark} is outside 0-100`);
  }

  return { problems, clean };
}

export function meritOf({ matric, inter, test }) {
  return Number((matric * 0.2 + inter * 0.3 + test * 0.5).toFixed(2));
}

export function decide(raw) {
  const { problems, clean } = cleanApplicant(raw);
  const base = { applicantId: clean.id ?? "?", applicantName: clean.name ?? "?", program: clean.program ?? "?" };

  // guard clause: no merit for invalid data
  if (problems.length > 0) {
    return { ...base, merit: null, status: DECISION.INVALID, remarks: problems };
  }

  const merit = meritOf(clean);
  const eligible = merit >= MIN.merit && clean.test >= MIN.entryTest && clean.inter >= MIN.intermediate;

  let status;
  const remarks = [];
  if (!eligible) {
    status = DECISION.REJECTED;
    if (merit < MIN.merit) remarks.push(`merit ${merit} < ${MIN.merit}`);
    if (clean.test < MIN.entryTest) remarks.push(`entry test ${clean.test} < ${MIN.entryTest}`);
    if (clean.inter < MIN.intermediate) remarks.push(`intermediate ${clean.inter} < ${MIN.intermediate}`);
  } else {
    status = merit >= SELECTION_MERIT && clean.feePaid ? DECISION.SELECTED : DECISION.WAITING;   // ternary
    if (status === DECISION.WAITING) {
      remarks.push(merit < SELECTION_MERIT ? `eligible, merit below ${SELECTION_MERIT}` : "eligible, fee not paid yet");
    } else {
      remarks.push(`merit ${merit} and fee paid`);
    }
  }

  return { ...base, merit, status, remarks };
}

export function runAdmissions(applicants) {
  if (!Array.isArray(applicants)) throw new TypeError("applicants should be an array");
  const decisions = [];
  for (let i = 0; i < applicants.length; i++) {
    decisions.push(decide(applicants[i]));
  }
  return decisions;
}

export function admissionSummary(decisions) {
  const summary = {
    valid: 0,
    invalid: 0,
    highest: null,
    lowestValidMerit: null,
    averageMerit: null,
    perProgram: {}
  };
  let total = 0;

  for (const d of decisions) {
    summary.perProgram[d.program] = (summary.perProgram[d.program] || 0) + 1;
    if (d.status === DECISION.INVALID) {
      summary.invalid += 1;
      continue;
    }
    summary.valid += 1;
    total += d.merit;
    if (summary.highest === null || d.merit > summary.highest.merit) {
      summary.highest = { applicantId: d.applicantId, applicantName: d.applicantName, merit: d.merit };
    }
    if (summary.lowestValidMerit === null || d.merit < summary.lowestValidMerit) summary.lowestValidMerit = d.merit;
  }

  summary.averageMerit = summary.valid ? Number((total / summary.valid).toFixed(2)) : null;
  return summary;
}
