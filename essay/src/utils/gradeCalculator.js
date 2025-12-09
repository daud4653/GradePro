/**
 * Calculate grade letter and GPA based on score and total marks
 * @param {number} score - The student's score
 * @param {number} totalMarks - Total marks for the assignment
 * @returns {Object} - { gradeLetter: string, gpa: number }
 */
export function calculateGradeAndGPA(score, totalMarks) {
  if (!score || !totalMarks || totalMarks <= 0) {
    return { gradeLetter: null, gpa: null };
  }

  // Calculate percentage
  const percentage = (score / totalMarks) * 100;

  let gradeLetter;
  let gpa;

  if (percentage >= 90) {
    gradeLetter = "A";
    gpa = 4.0;
  } else if (percentage >= 80) {
    gradeLetter = "B";
    gpa = 3.0;
  } else if (percentage >= 70) {
    gradeLetter = "C";
    gpa = 2.0;
  } else if (percentage >= 60) {
    gradeLetter = "D";
    gpa = 1.0;
  } else {
    gradeLetter = "F";
    gpa = 0.0;
  }

  return { gradeLetter, gpa };
}

