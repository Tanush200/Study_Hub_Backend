const express = require('express');
const {
  uploadNote,
  getNotes,
  getMyNotes,
} = require("../controllers/noteController");

const authMiddleware = require('../middleware/auth');
const upload  = require('../middleware/upload');
const router = express.Router();


router.get("/", getNotes);
router.post("/upload", authMiddleware, upload.single("file"), uploadNote);
router.get("/my-notes", authMiddleware, getMyNotes);

module.exports = router;



