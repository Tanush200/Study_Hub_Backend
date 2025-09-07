const { application } = require('express');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, Word, JPG, and PNG are allowed."), false);
    }
}


const upload = multer({
    storage:storage,
    limits:{
        fileSize: 50 * 1024 * 1024  
    },
    fileFilter:fileFilter
});

module.exports = upload;