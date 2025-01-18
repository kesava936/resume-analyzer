/**
 * Skill categories with per-skill points and a category score cap.
 */
const SKILL_CATEGORIES = {
  programming: {
    skills: ["java", "python", "c++", "c#", "typescript", "kotlin", "swift", "javascript", "node"],
    pointsPerSkill: 10,
    cap: 25,
  },
  web: {
    skills: ["react", "node", "angular", "vue", "html", "css", "javascript"],
    pointsPerSkill: 8,
    cap: 20,
  },
  database: {
    skills: ["sql", "mongodb", "postgresql", "mysql", "redis"],
    pointsPerSkill: 8,
    cap: 15,
  },
  tools: {
    skills: ["git", "docker", "kubernetes", "jenkins", "aws", "linux"],
    pointsPerSkill: 5,
    cap: 10,
  },
  soft: {
    skills: ["communication", "teamwork", "leadership", "problem-solving", "adaptability"],
    pointsPerSkill: 3,
    cap: 10,
  },
};

// ─────────────────────────────────────────────────────────────
// KEYWORDS
// ─────────────────────────────────────────────────────────────

const FULL_STACK_KEYWORDS = ["node", "react", "api", "backend", "database", "express", "mongodb", "postgresql", "mysql", "rest", "graphql"];
const FRONTEND_KEYWORDS   = ["html", "css", "javascript", "react", "vue", "angular", "ui", "frontend", "responsive"];
const PROJECT_TRIGGER_WORDS = ["project", "developed", "built", "created", "implemented", "designed", "engineered"];
const PROJECT_BOOST_KEYWORDS = ["api", "backend", "deployment", "aws", "docker"];

// Root-based soft skill keywords
const SOFT_SIGNAL_KEYWORDS = [
  "team", "collaborat", "mentor", "lead", "manag",
  "communicat", "agile", "scrum", "work"
];

// Prevent double counting
const PRIMARY_CATEGORY = {
  node:       "programming",
  javascript: "programming",
  html:       "web",
  css:        "web",
  react:      "web",
  angular:    "web",
  vue:        "web",
};

// Skill weights
const SKILL_WEIGHTS = {
  react:      1.5,
  node:       1.5,
  aws:        1.5,
  docker:     1.5,
  kubernetes: 1.5,
  html:       0.7,
  css:        0.7,
};

// Constants
const MAX_FINAL_SCORE   = 100;
const MAX_PROJECT_SCORE = 20;
const PROJECT_BOOST     = 5;
const SKILL_COUNT_BONUS = 5;

// ─────────────────────────────────────────────────────────────
// CALCULATE SKILL SCORE
// ─────────────────────────────────────────────────────────────

const calculateScore = (detectedSkills) => {
  if (!Array.isArray(detectedSkills)) {
    throw new Error("detectedSkills must be an array.");
  }

  const skillSet = new Set(detectedSkills.map((s) => s.toLowerCase().trim()));
  const scored   = new Set();

  const total = Object.entries(SKILL_CATEGORIES).reduce((sum, [categoryName, category]) => {
    const raw = category.skills.reduce((catSum, skill) => {
      if (!skillSet.has(skill)) return catSum;

      const primary = PRIMARY_CATEGORY[skill];
      if (primary && primary !== categoryName) return catSum;

      if (scored.has(skill)) return catSum;
      scored.add(skill);

      const weight = SKILL_WEIGHTS[skill] ?? 1.0;
      const points = Math.round(category.pointsPerSkill * weight);

      return catSum + points;
    }, 0);

    return sum + Math.min(raw, category.cap);
  }, 0);

  return Math.round(total);
};

// ─────────────────────────────────────────────────────────────
// SOFT SKILL SCORE
// ─────────────────────────────────────────────────────────────

const calculateSoftScore = (detectedSkills, resumeText) => {
  const skillSet = new Set(detectedSkills.map((s) => s.toLowerCase().trim()));
  const category = SKILL_CATEGORIES.soft;

  const raw    = category.skills.filter((s) => skillSet.has(s)).length * category.pointsPerSkill;
  const capped = Math.min(raw, category.cap);

  if (!resumeText || typeof resumeText !== "string") return capped;

  const text = resumeText.toLowerCase();

  // Regex-based root matching
  const matchedSignals = new Set();

  SOFT_SIGNAL_KEYWORDS.forEach((kw) => {
    const regex = new RegExp(`\\b${kw}\\w*\\b`, "i");
    if (regex.test(text)) {
      matchedSignals.add(kw);
    }
  });

  const signalCount = matchedSignals.size;

  let signalScore = 0;
  if      (signalCount >= 5) signalScore = 10;
  else if (signalCount >= 3) signalScore = 7;
  else if (signalCount >= 1) signalScore = 5;

  return Math.min(Math.max(capped, signalScore), category.cap);
};

// ─────────────────────────────────────────────────────────────
// PROJECT SCORE
// ─────────────────────────────────────────────────────────────

const calculateProjectScore = (resumeText) => {
  if (!resumeText || typeof resumeText !== "string") return 0;

  const text = resumeText.toLowerCase();

  const projectCount = PROJECT_TRIGGER_WORDS.reduce((count, word) => {
    const matches = (text.match(new RegExp(`\\b${word}\\b`, "g")) || []).length;
    return count + matches;
  }, 0);

  if (projectCount === 0) return 0;

  const fullStackCount = FULL_STACK_KEYWORDS.filter((kw) => text.includes(kw)).length;
  const frontendCount  = FRONTEND_KEYWORDS.filter((kw) => text.includes(kw)).length;

  const isFullStack    = fullStackCount >= 3;
  const isFrontendOnly = frontendCount >= 2 && fullStackCount < 3;

  let base = 0;

  if      (isFullStack && projectCount >= 4)    base = MAX_PROJECT_SCORE;
  else if (isFullStack && projectCount >= 2)     base = 15;
  else if (isFrontendOnly && projectCount >= 2)  base = 10;
  else if (projectCount >= 1)                    base = 5;

  const boostCount = PROJECT_BOOST_KEYWORDS.filter((kw) => text.includes(kw)).length;

  if (boostCount >= 3) {
    base = Math.min(Math.max(base + PROJECT_BOOST, 15), MAX_PROJECT_SCORE);
  } else if (boostCount >= 1) {
    base = Math.min(Math.max(base + PROJECT_BOOST, 10), MAX_PROJECT_SCORE);
  }

  return base;
};

// ─────────────────────────────────────────────────────────────
// BREAKDOWN
// ─────────────────────────────────────────────────────────────

const getScoreBreakdown = (detectedSkills, resumeText = "") => {
  const skillSet  = new Set(detectedSkills.map((s) => s.toLowerCase().trim()));
  const breakdown = {};

  for (const [categoryName, category] of Object.entries(SKILL_CATEGORIES)) {
    const matchedSkills = category.skills.filter((skill) => skillSet.has(skill));
    const raw    = matchedSkills.length * category.pointsPerSkill;
    let   capped = Math.min(raw, category.cap);

    if (categoryName === "soft") {
      capped = calculateSoftScore(detectedSkills, resumeText);
    }

    breakdown[categoryName] = {
      matchedSkills,
      rawScore: raw,
      score:    capped,
      cap:      category.cap,
    };
  }

  // Append project score as its own breakdown category
  const projectScore = calculateProjectScore(resumeText);
  breakdown.project = {
    matchedSkills: [],
    rawScore:      projectScore,
    score:         projectScore,
    cap:           MAX_PROJECT_SCORE,
  };

  return breakdown;
};

// ─────────────────────────────────────────────────────────────
// DECISION + FINAL SCORE
// ─────────────────────────────────────────────────────────────

const getDecision = (score) => {
  if (score >= 70) return "Move Forward";
  if (score >= 50) return "Borderline";
  return "Do Not Move Forward";
};

const calculateFinalScore = (skills, resumeText) => {
  const skillSet = new Set(skills.map((s) => s.toLowerCase().trim()));

  const skillScore = Object.entries(SKILL_CATEGORIES).reduce((sum, [categoryName, category]) => {
    if (categoryName === "soft") {
      return sum + calculateSoftScore(skills, resumeText);
    }

    const scored = new Set();

    const raw = category.skills.reduce((catSum, skill) => {
      if (!skillSet.has(skill)) return catSum;

      const primary = PRIMARY_CATEGORY[skill];
      if (primary && primary !== categoryName) return catSum;
      if (scored.has(skill)) return catSum;

      scored.add(skill);

      const weight = SKILL_WEIGHTS[skill] ?? 1.0;
      const points = Math.round(category.pointsPerSkill * weight);

      return catSum + points;
    }, 0);

    return sum + Math.min(raw, category.cap);
  }, 0);

  const projectScore = calculateProjectScore(resumeText);
  const breadthBonus = skillSet.size >= 8 ? SKILL_COUNT_BONUS : 0;

  const total = Math.min(skillScore + projectScore + breadthBonus, MAX_FINAL_SCORE);

  return {
    score:    total,
    decision: getDecision(total),
  };
};

module.exports = {
  calculateScore,
  calculateProjectScore,
  calculateFinalScore,
  getDecision,
  getScoreBreakdown,
  SKILL_CATEGORIES,
};