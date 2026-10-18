// =====================================================================
// Task 3 - Safe Student Profile Update Service
// Taimur Sajid (241839)
//
// mergeProfile(student, changes) returns a NEW object. The original is
// never touched. Nested address/contact are merged field by field.
// 0, false and "" are real values and are applied; only `undefined`
// means "this field was not sent".
// =====================================================================

// drops keys whose value is undefined
// (array destructuring of [key, value] pairs inside filter)
function keepDefined(obj = {}) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
}

export function mergeProfile(student, changes = {}) {
  if (typeof student !== "object" || student === null) throw new TypeError("student must be an object");
  if (typeof changes !== "object" || changes === null || Array.isArray(changes)) {
    throw new TypeError("changes must be an object");
  }

  // object destructuring + renaming + default values + object rest
  const { address: oldAddress = {}, contact: oldContact = {}, ...oldBasics } = student;
  const { address: newAddress = {}, contact: newContact = {}, ...newBasics } = changes;

  // spread creates fresh objects at every level that we touch
  const address = { ...oldAddress, ...keepDefined(newAddress) };
  const contact = { ...oldContact, ...keepDefined(newContact) };

  // property shorthand for address and contact
  return { ...oldBasics, ...keepDefined(newBasics), address, contact };
}

// rest parameters: apply any number of updates one after another
export function mergeMany(student, ...changeList) {
  return changeList.reduce((current, change) => mergeProfile(current, change), student);
}

// nested destructuring + renaming + defaults + optional chaining + ??
export function profileCard(student) {
  const {
    name: fullName,
    marks,
    scholarship,
    address: { city = "N/A", sector = "N/A" } = {},
    contact: { email = "no email", phone = "no phone" } = {}
  } = student;

  return {
    fullName,
    location: `${sector}, ${city}`,
    email,
    phone,
    marks: marks ?? "not entered",              // 0 stays 0
    marksWithOr: marks || "not entered",        // 0 would be lost with ||
    scholarship: scholarship ?? false,
    hasPhone: Boolean(student.contact?.phone),  // optional chaining
    postcode: student.address?.postcode ?? "unknown"
  };
}

// Reference challenge: === compares references (same object in memory), not contents
export function referenceReport(original, updated) {
  const rows = [
    ["original vs updated", original, updated],
    ["original.address vs updated.address", original.address, updated.address],
    ["original.contact vs updated.contact", original.contact, updated.contact]
  ];
  return rows.map(([pair, a, b]) => ({
    pair,
    sameReference: a === b,
    why: a === b
      ? "both names point to the same object"
      : "mergeProfile built a new object with { ...spread }, so this is a different object in memory"
  }));
}
