const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const s3Client = require("../utils/s3");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const authMiddleware = require("../middleware/auth");

router.post("/image", authMiddleware, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const fileName = `${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
        const key = `study_hub/notes_images/${fileName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        });

        await s3Client.send(command);

        const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        res.json({ url });
    } catch (error) {
        console.error("Image upload error:", error);
        res.status(500).json({ message: "Image upload failed" });
    }
});

module.exports = router;
