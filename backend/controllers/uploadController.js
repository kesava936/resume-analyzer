const path = require("path");
const { saveResumeMetadata, getAllResumes, extractTextFromPDF } = require("../services/uploadService");
const { detectSkills } = require("../services/skillService");
const { calculateFinalScore, getScoreBreakdown } = require("../services/scoringService");

const uploadResume = async (req, res) => {
  try {
    console.log("Request received");

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    let extractedText = null;
    let skills = [];
    let score = 0;
    let decision = null;
    let breakdown = {};
    let extractedEmail = null;
    let extractedName = req.file.originalname;

    if (req.file.mimetype === "application/pdf") {
      extractedText = await extractTextFromPDF(req.file.path);

      if (!extractedText) {
        return res.status(400).json({
          success: false,
          message: "Could not extract text from PDF",
        });
      }

      // ✅ TASK 3 — Safety check: ensure extracted text is not empty
      if (!extractedText.trim()) {
        return res.status(400).json({
          success: false,
          message: "Resume text extraction failed",
        });
      }

      // Name extraction — first non-empty line
      const lines = extractedText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      extractedName = lines[0];

      // Email extraction
      const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
      const emailMatch = extractedText.match(emailRegex);
      extractedEmail = emailMatch ? emailMatch[0] : null;

      if (!extractedEmail) {
        return res.status(400).json({
          success: false,
          message: "Email not found in resume",
        });
      }

      // Skill detection and scoring
      skills = detectSkills(extractedText).map((s) => s.toLowerCase());

      // ✅ TASK 2 — Debug logs before scoring
      console.log("Extracted text length:", extractedText?.length);
      console.log("Detected skills:", skills);

      const result = calculateFinalScore(skills, extractedText);
      score = result.score;
      decision = result.decision;

      // ✅ TASK 1 — Breakdown called with extractedText
      breakdown = getScoreBreakdown(skills, extractedText);
    }

    const fileData = {
      originalName: extractedName,
      email: extractedEmail,
      resumeText: extractedText,
      skills,
      score,
      decision,
      breakdown,
      feedbackText: null,
    };

    const insertedId = await saveResumeMetadata(fileData);

    return res.status(201).json({
      success: true,
      message: "Resume uploaded successfully.",
      data: {
        id: insertedId,
        extractedText,
        skills,
        score,
        decision,
        breakdown,
        summary: {
          score,
          decision,
          breakdown,
          skills,
        },
      },
    });

  } catch (error) {
    console.error("Upload error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const listResumes = async (req, res) => {
  try {
    const resumes = await getAllResumes();
    return res.status(200).json({ success: true, data: resumes });
  } catch (error) {
    console.error("Fetch error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadResume, listResumes };