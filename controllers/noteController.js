const Note = require("../models/Note");
const User = require("../models/User");
const cloudinary = require("../utils/cloudinary");

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (fileBuffer, fileName , folder = 'study_hub/notes') => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({
            resource_type:'auto',
            folder: folder,
            public_id: fileName,
            user_filename: true,
            unique_filename: false,
        },
        (error,result) => {
            if(error) return reject(error);
            else return resolve(result);
        }
    ).end(fileBuffer);
    });
};

// POST /api/notes/upload
const uploadNote = async (req,res) =>{
    try {
        const {title, description, category} = req.body;
        const userId = req.user.userId;

        if(!req.file){
            return res.status(400).json({message: "No file uploaded"}); 

        }

        
        if (!title) {
        return res.status(400).json({ message: "Title is required" });
        }

        const uploadResult = await uploadToCloudinary(
            req.file.buffer,
            `${Date.now()}_${req.file.originalname}`,
            'study_hub/notes'
        );

        const note = await Note.create({
          title,
          description: description || "",
          uploaderId: userId,
          category: category ? JSON.parse(category) : {},
          file: {
            cloudinaryId: uploadResult.public_id,
            originalName: req.file.originalname,
            fileUrl: uploadResult.secure_url,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            thumbnail: uploadResult.secure_url,
          },
        });

        await User.findByIdAndUpdate(userId, {
            $inc :{'stats.notesUploaded': 1}
        });
        res.status(201).json({
          message: "Note uploaded successfully",
          note: {
            id: note._id,
            title: note.title,
            description: note.description,
            fileUrl: note.file.fileUrl,
            uploadedAt: note.createdAt,
          },
        });

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Upload failed", error: error.message });
    }
}