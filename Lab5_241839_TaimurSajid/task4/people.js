// =====================================================================
// Task 4 - University User Hierarchy and Dynamic `this`
// Taimur Sajid (241839)
//
//            Person
//           /      \
//      Student    FacultyMember
//
// constructor : sets up a new object's fields
// new         : creates the object, links its prototype, runs the constructor
// extends     : the child class inherits from the parent class
// super(...)  : runs the parent constructor; super.introduce() runs the parent method
// override    : a child defines its own version of a parent method
// polymorphism: the version that runs depends on the real object at run time
// =====================================================================

export class Person {
  constructor(name, email) {
    if (!name || typeof name !== "string") throw new TypeError("Person needs a name");
    if (typeof email !== "string" || !email.includes("@")) throw new TypeError(`invalid email: ${email}`);
    this.name = name;
    this.email = email;
  }

  introduce() {
    return `My name is ${this.name}, you can email me at ${this.email}.`;
  }
}

export class Student extends Person {
  constructor(name, email, rollNo, marks) {
    super(name, email);
    if (!Number.isFinite(marks) || marks < 0 || marks > 100) throw new RangeError(`marks out of range: ${marks}`);
    this.rollNo = rollNo;
    this.marks = marks;
  }

  introduce() {
    // reuse the parent sentence, then add student details
    return `${super.introduce()} I'm a student (roll no. ${this.rollNo}).`;
  }

  getResult() {
    let result;
    if (this.marks >= 85) result = "Distinction";
    else if (this.marks >= 50) result = "Pass";
    else result = "Fail";
    return `${this.name} scored ${this.marks}: ${result}`;
  }
}

export class FacultyMember extends Person {
  constructor(name, email, employeeId, department) {
    super(name, email);
    if (!employeeId || !department) throw new TypeError("faculty needs an employeeId and a department");
    this.employeeId = employeeId;
    this.department = department;
  }

  introduce() {
    return `${super.introduce()} I'm faculty in ${this.department} (ID ${this.employeeId}).`;
  }
}

export function kindOf(user) {
  if (user instanceof Student) return "Student";
  if (user instanceof FacultyMember) return "FacultyMember";
  if (user instanceof Person) return "Person";
  return "unknown";
}
