const db = require("../config/db");

/**
 * GET /api/skills
 * Returns all skill names from the Skills table as a flat JSON array.
 */
const getAllSkills = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT skill_name FROM Skills ORDER BY skill_name ASC`
    );

    const skills = rows.map((row) => row.skill_name);

    return res.status(200).json({ success: true, data: skills });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = { getAllSkills };