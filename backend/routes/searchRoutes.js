const express = require("express");
const router = express.Router();
const { searchBySkill } = require("../controllers/searchController");

router.get("/search", searchBySkill);

module.exports = router;