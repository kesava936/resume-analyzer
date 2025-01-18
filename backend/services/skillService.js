/**
 * Predefined skills list to match against resume text.
 * Grouped by category for readability — only this array needs updating
 * to add/remove skills. Detection logic below is unchanged.
 */
const PREDEFINED_SKILLS = [
  // Programming languages
  "java", "python", "javascript", "typescript", "c", "c++", "c#",
  "kotlin", "swift", "go", "rust", "php", "ruby", "scala", "r",

  // Web — frontend
  "react", "angular", "vue", "html", "css", "sass", "redux", "nextjs",

  // Web — backend
  "node", "express", "django", "flask", "spring", "laravel",

  // Databases
  "sql", "mysql", "postgresql", "mongodb", "redis", "sqlite",
  "oracle", "cassandra", "dynamodb",

  // Tools & DevOps
  "git", "docker", "kubernetes", "aws", "azure", "gcp",
  "linux", "jenkins", "terraform", "ansible", "nginx",

  // Soft skills
  "communication", "teamwork", "leadership", "adaptability", "problem-solving",
];

/**
 * Escapes special regex characters in a string
 * so it can be safely used inside a RegExp.
 */
const escapeRegex = (str) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Normalises resume text to collapse common ".js" and punctuation variants
 * so patterns like "react.js" and "node.js" match their canonical skill names.
 *
 * @param {string} text - Raw resume text
 * @returns {string} - Normalised lowercase text
 */
const normalizeText = (text) =>
  text
    .toLowerCase()
    // "react.js" → "react", "node.js" → "node", "vue.js" → "vue"
    .replace(/\b(\w+)\.js\b/g, "$1")
    // Keep c++, c# intact; remove noisy punctuation
    .replace(/[^\w\s+#.-]/g, " ");

/**
 * Detects skills from resume text by matching against the predefined skills list.
 * @param {string} resumeText - Plain text extracted from a resume
 * @returns {string[]} - Array of matched skills (lowercase, deduplicated)
 * @throws {Error} - If resumeText is not a non-empty string
 */
const detectSkills = (resumeText) => {
  if (!resumeText || typeof resumeText !== "string") {
    throw new Error("resumeText must be a non-empty string.");
  }

  const normalizedText = normalizeText(resumeText);

  const detectedSkills = PREDEFINED_SKILLS.filter((skill) => {
    const escapedSkill = escapeRegex(skill);
    return new RegExp(`\\b${escapedSkill}\\b`).test(normalizedText);
  });

  return detectedSkills;
};

module.exports = { detectSkills, PREDEFINED_SKILLS };