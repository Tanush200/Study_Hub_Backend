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
// const uploadNote = async (req,res) =>{
//     try {
//         const {title, description, category} = req.body;
//         const userId = req.user._id;

//         if(!req.file){
//             return res.status(400).json({message: "No file uploaded"}); 

//         }

        
//         if (!title) {
//         return res.status(400).json({ message: "Title is required" });
//         }

//         const uploadResult = await uploadToCloudinary(
//             req.file.buffer,
//             `${Date.now()}_${req.file.originalname}`,
//             'study_hub/notes'
//         );

//         const note = await Note.create({
//           title,
//           description: description || "",
//           uploaderId: userId,
//           category: category ? JSON.parse(category) : {},
//           file: {
//             cloudinaryId: uploadResult.public_id,
//             originalName: req.file.originalname,
//             fileUrl: uploadResult.secure_url,
//             fileType: req.file.mimetype,
//             fileSize: req.file.size,
//             thumbnail: uploadResult.secure_url,
//           },
//         });

//         await User.findByIdAndUpdate(userId, {
//             $inc :{'stats.notesUploaded': 1}
//         });
//         res.status(201).json({
//           message: "Note uploaded successfully",
//           note: {
//             id: note._id,
//             title: note.title,
//             description: note.description,
//             fileUrl: note.file.fileUrl,
//             uploadedAt: note.createdAt,
//           },
//         });

//     } catch (error) {
//         console.error("Upload error:", error);
//         res.status(500).json({ message: "Upload failed", error: error.message });
//     }
// }

const uploadNote = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const userId = req.user._id; // Make sure this is _id, not userId

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // Parse category JSON string
    let parsedCategory = {};
    try {
      parsedCategory = category ? JSON.parse(category) : {};
    } catch (parseError) {
      console.error("Category JSON parse error:", parseError);
      parsedCategory = { subject: "General", examType: "semester" };
    }

    // Upload file to Cloudinary
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      `${Date.now()}_${req.file.originalname}`,
      "study_hub/notes"
    );

    // Create note in database
    const note = await Note.create({
      title,
      description: description || "",
      uploaderId: userId,
      category: {
        subject: parsedCategory.subject || "General",
        topic: parsedCategory.topic || "",
        examType: parsedCategory.examType || "semester",
        class: parsedCategory.class || "",
        university: parsedCategory.university || "",
      },
      file: {
        cloudinaryId: uploadResult.public_id,
        originalName: req.file.originalname,
        fileUrl: uploadResult.secure_url,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        thumbnail: uploadResult.secure_url,
      },
      metadata: {
        views: 0,
        downloads: 0,
        likes: 0,
        dislikes: 0,
        averageRating: 0,
        tags: [],
      },
      status: "pending",
    });

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { "stats.notesUploaded": 1 },
    });

    res.status(201).json({
      message: "Note uploaded successfully",
      note: {
        _id: note._id,
        title: note.title,
        description: note.description,
        category: note.category,
        fileUrl: note.file.fileUrl,
        createdAt: note.createdAt,
        status: note.status,
        file: {
          fileSize: note.file.fileSize,
          originalName: note.file.originalName,
        },
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};



const getNotes = async (req,res) => {
    try {
        const {page = 1, limit = 10, search, subject} = req.query;
        let query = {status: 'approved'};

        if(search) {
            query.$or = [
                {title: {$regex: search, $options: 'i'}},
                {description: {$regex: search, $options: 'i'}},
                {'metadata.tags':{$in :[new RegExp(search, 'i')]}}
            ];

        }

        if(subject) {
            query['category.subject'] = subject;
        }
        const notes = await Note.find(query)
        .populate('uploaderId', 'username profile')
        .sort({createdAt: -1})
        .limit(limit *  1)
        .skip((page - 1) * limit);

        const total = await Note.countDocuments(query);

        res.status(200).json({
            notes,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            total
        })
    } catch (error) {
        console.error("Get notes error:", error);
        res.status(500).json({ message: "Server error" });
    }
}



const getMyNotes = async (req,res) => {
    try {
        const userId = req.user._id;

        const notes = await Note.find({uploaderId: userId}).sort({createdAt: -1});
        res.status(200).json(notes);
    } catch (error) {
        console.error("Get my notes error:", error);
        res.status(500).json({ message: "Server error" });
    }
}


module.exports = {
    uploadNote,
    getNotes,
    getMyNotes
}