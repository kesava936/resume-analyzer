const fs = require("fs").promises;
const pdfParse = require("pdf-parse");
const db = require("../config/db");

/**
 * Reads a PDF file from disk and extracts its text content.
 * @param {string} filePath - Absolute path to the uploaded PDF (req.file.path)
 * @returns {Promise<string>} - Extracted plain text
 * @throws {Error} - Descriptive error for missing file, bad path, or parse failure
 */
const extractTextFromPDF = async (filePath) => {
  if (!filePath) {
    throw new Error("filePath is required to extract text from PDF.");
  }

  // Read file asynchronously — throws if path does not exist
  let fileBuffer;
  try {
    fileBuffer = await fs.readFile(filePath);
  } catch (err) {
    throw new Error(`Failed to read file at "${filePath}": ${err.message}`);
  }

  // Parse PDF buffer — throws if file is corrupt or not a valid PDF
  let parsed;
  try {
    parsed = await pdfParse(fileBuffer);
  } catch (err) {
    throw new Error(`Failed to parse PDF at "${filePath}": ${err.message}`);
  }

  const extractedText = parsed.text.trim();

  if (!extractedText) {
    throw new Error(
      "PDF parsed successfully but no text was found. " +
        "The file may be image-based (scanned) or empty."
    );
  }

  return extractedText;
};

/**
 * Saves resume file metadata to the database.
 * @param {Object} fileData - { originalName, storedName, filePath, mimeType, size }
 * @returns {Promise<number>} - Inserted record ID
 */
const saveResumeMetadata = async (fileData) => {
  const { originalName, email, resumeText, skills, score, decision, breakdown, feedbackText } = fileData;

  if (!Array.isArray(skills)) {
    throw new Error("fileData.skills must be an array.");
  }

  if (typeof score !== "number" || isNaN(score) || score < 0) {
    throw new Error("fileData.score must be a non-negative number.");
  }

  // Normalize skills
  const normalizedSkills = [...new Set(skills.map(s => s.trim().toLowerCase()))];

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Insert student
    const [studentResult] = await connection.execute(
      `INSERT INTO Students (name, email, resume_text, resume_score, decision, breakdown, feedback_text)
VALUES (?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  name         = VALUES(name),
  resume_text  = VALUES(resume_text),
  resume_score = VALUES(resume_score),
  decision     = VALUES(decision),
  breakdown    = VALUES(breakdown),
  feedback_text = VALUES(feedback_text)`,
      [
        originalName,
        email || null,
        resumeText,
        score,
        decision || null,
        breakdown ? JSON.stringify(breakdown) : null,
        feedbackText || null,
      ]
    );

    const studentId = studentResult.insertId;

    // 2. Insert skills + mapping
    for (const skillName of normalizedSkills) {
      await connection.execute(
        `INSERT IGNORE INTO Skills (skill_name) VALUES (?)`,
        [skillName]
      );

      const [rows] = await connection.execute(
        `SELECT skill_id FROM Skills WHERE skill_name = ?`,
        [skillName]
      );

      const skillId = rows[0].skill_id;

      await connection.execute(
        `INSERT IGNORE INTO Student_Skills (student_id, skill_id)
         VALUES (?, ?)`,
        [studentId, skillId]
      );
    }

    await connection.commit();
    connection.release();

    return studentId;

  } catch (err) {
    await connection.rollback();
    connection.release();
    throw err;
  }
};

/**
 * Fetches all uploaded resumes from the database.
 * @returns {Promise<Array>}
 */
const getAllResumes = async () => {
  const [rows] = await db.execute(
    `SELECT
       s.student_id,
       s.name,
       s.email,
       s.resume_score,
       s.feedback_text,
       s.created_at,
       GROUP_CONCAT(sk.skill_name ORDER BY sk.skill_name SEPARATOR ', ') AS skills
     FROM Students s
     LEFT JOIN Student_Skills ss ON s.student_id = ss.student_id
     LEFT JOIN Skills sk         ON ss.skill_id  = sk.skill_id
     GROUP BY s.student_id
     ORDER BY s.created_at DESC`
  );
  return rows;
};

module.exports = { extractTextFromPDF, saveResumeMetadata, getAllResumes };