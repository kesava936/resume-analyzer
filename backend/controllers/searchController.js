const db = require("../config/db");

const searchBySkill = async (req, res) => {
  const { skill } = req.query;

  if (!skill || !skill.trim()) {
    return res.status(400).json({
      success: false,
      message: "Query param 'skill' is required."
    });
  }

  const [rows] = await db.execute(
    `SELECT   st.name,
              st.resume_score,
              GROUP_CONCAT(sk.skill_name ORDER BY sk.skill_name SEPARATOR ', ') AS skills
     FROM     Students       st
     JOIN     Student_Skills ss ON st.student_id = ss.student_id
     JOIN     Skills         sk ON ss.skill_id   = sk.skill_id
     WHERE    st.student_id IN (
                SELECT ss2.student_id
                FROM   Student_Skills ss2
                JOIN   Skills sk2 ON ss2.skill_id = sk2.skill_id
                WHERE  sk2.skill_name = ?
              )
     GROUP BY st.student_id, st.name, st.resume_score
     ORDER BY st.resume_score DESC`,
    [skill.trim().toLowerCase()]
  );

  return res.status(200).json({
    success: true,
    count: rows.length,
    data: rows
  });
};

module.exports = { searchBySkill };