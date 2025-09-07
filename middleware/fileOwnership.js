const Note = require("../models/Note");

const fileOwnership = async (req,res,next) => {
    try {
        const noteId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;
        const note = await Note.findById(noteId);

        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }

        if(userRole === "admin" || note.uploaderId.toString()===userId){
            req.note = note;
            next();
        } else {
            return res.status(403).json({ message: "Access denied. Not the owner." });
        }
    } catch (error) {
        console.error("File ownership check error:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

module.exports = fileOwnership;