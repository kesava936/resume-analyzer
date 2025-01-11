const express = require("express");
const router = express.Router();
const upload = require("../middleware/multerConfig");
const { uploadResume, listResumes } = require("../controllers/uploadController");

// Multer error handler middleware (scoped to this router)
const handleMulterError = (err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File too large. Max size is 5MB." });
  }
  if (err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};

// POST /api/upload  — upload a single resume
router.post("/", upload.single("resume"), uploadResume, handleMulterError);

// GET /api/upload   — list all uploaded resumes
router.get("/", listResumes);

module.exports = router;