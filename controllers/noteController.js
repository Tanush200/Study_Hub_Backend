// For Cloudinary Integration
// const Note = require("../models/Note");
// const User = require("../models/User");
// const Comment = require("../models/Comment"); 
// const cloudinary = require("../utils/cloudinary");


// const uploadToCloudinary = async (fileBuffer, fileName , folder = 'study_hub/notes') => {
//     return new Promise((resolve, reject) => {
//         cloudinary.uploader.upload_stream({
//             resource_type:'auto',
//             folder: folder,
//             public_id: fileName,
//             user_filename: true,
//             unique_filename: false,
//         },
//         (error,result) => {
//             if(error) return reject(error);
//             else return resolve(result);
//         }
//     ).end(fileBuffer);
//     });
// };

// const uploadNote = async (req, res) => {
//   try {
//     const { title, description, category } = req.body;
//     const userId = req.user._id;

//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     if (!title) {
//       return res.status(400).json({ message: "Title is required" });
//     }

//     let parsedCategory = {};
//     try {
//       parsedCategory = category ? JSON.parse(category) : {};
//     } catch (parseError) {
//       console.error("Category JSON parse error:", parseError);
//       parsedCategory = { subject: "General", examType: "semester" };
//     }

//     const uploadResult = await uploadToCloudinary(
//       req.file.buffer,
//       `${Date.now()}_${req.file.originalname}`,
//       "study_hub/notes"
//     );


//     const note = await Note.create({
//       title,
//       description: description || "",
//       uploaderId: userId,
//       category: {
//         subject: parsedCategory.subject || "General",
//         topic: parsedCategory.topic || "",
//         examType: parsedCategory.examType || "semester",
//         class: parsedCategory.class || "",
//         university: parsedCategory.university || "",
//       },
//       file: {
//         cloudinaryId: uploadResult.public_id,
//         originalName: req.file.originalname,
//         fileUrl: uploadResult.secure_url,
//         fileType: req.file.mimetype,
//         fileSize: req.file.size,
//         thumbnail: uploadResult.secure_url,
//       },
//       metadata: {
//         views: 0,
//         downloads: 0,
//         likes: 0,
//         dislikes: 0,
//         averageRating: 0,
//         tags: [],
//       },
//       status: "pending",
//     });

//     await User.findByIdAndUpdate(userId, {
//       $inc: { "stats.notesUploaded": 1 },
//     });

//     res.status(201).json({
//       message: "Note uploaded successfully",
//       note: {
//         _id: note._id,
//         title: note.title,
//         description: note.description,
//         category: note.category,
//         fileUrl: note.file.fileUrl,
//         createdAt: note.createdAt,
//         status: note.status,
//         file: {
//           fileSize: note.file.fileSize,
//           originalName: note.file.originalName,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("Upload error:", error);
//     res.status(500).json({ message: "Upload failed", error: error.message });
//   }
// };



// // const getNotes = async (req,res) => {
// //     try {
// //         const {page = 1, limit = 10, search, subject} = req.query;
// //         let query = {status: 'approved'};

// //         if(search) {
// //             query.$or = [
// //                 {title: {$regex: search, $options: 'i'}},
// //                 {description: {$regex: search, $options: 'i'}},
// //                 {'metadata.tags':{$in :[new RegExp(search, 'i')]}}
// //             ];

// //         }

// //         if(subject) {
// //             query['category.subject'] = subject;
// //         }
// //         const notes = await Note.find(query)
// //         .populate('uploaderId', 'username profile')
// //         .sort({createdAt: -1})
// //         .limit(limit *  1)
// //         .skip((page - 1) * limit);

// //         const notesWithCommentCount = await Promise.all(
// //           notes.map(async (note) => {
// //             const commentCount = await Comment.countDocuments({
// //               noteId: note._id,
// //               isDeleted: false,
// //             });
// //             return {
// //               ...note.toObject(),
// //               commentCount,
// //             };
// //           })
// //         );

// //         const total = await Note.countDocuments(query);

// //         res.status(200).json({
// //             notes: notesWithCommentCount,
// //             totalPages: Math.ceil(total / limit),
// //             currentPage: Number(page),
// //             total
// //         })
// //     } catch (error) {
// //         console.error("Get notes error:", error);
// //         res.status(500).json({ message: "Server error" });
// //     }
// // }


// const getNotes = async (req, res) => {
//     try {
//         const { page = 1, limit = 10, search, subject } = req.query;
//         let query = { status: 'approved' };

//         if (search) {
//             query.$or = [
//                 { title: { $regex: search, $options: 'i' } },
//                 { description: { $regex: search, $options: 'i' } },
//                 { 'metadata.tags': { $in: [new RegExp(search, 'i')] } }
//             ];
//         }

//         if (subject) {
//             query['category.subject'] = subject;
//         }

//         const notes = await Note.find(query)
//             .populate('uploaderId', 'username profile')
//             .sort({ createdAt: -1 })
//             .limit(limit * 1)
//             .skip((page - 1) * limit);


//         const noteIds = notes.map(note => note._id);
//         const commentCounts = await Comment.aggregate([
//             { $match: { isDeleted: false, noteId: { $in: noteIds } } },
//             { $group: { _id: "$noteId", count: { $sum: 1 } } }
//         ]);

//         const countMap = commentCounts.reduce((acc, cur) => {
//             acc[cur._id.toString()] = cur.count;
//             return acc;
//         }, {});

//         const notesWithCommentCount = notes.map(note => ({
//             ...note.toObject(),
//             commentCount: countMap[note._id.toString()] || 0
//         }));

//         const total = await Note.countDocuments(query);

//         res.status(200).json({
//             notes: notesWithCommentCount,
//             totalPages: Math.ceil(total / limit),
//             currentPage: Number(page),
//             total
//         });
//     } catch (error) {
//         console.error("Get notes error:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// };



// // const getMyNotes = async (req,res) => {
// //     try {
// //         const userId = req.user._id;

// //         const notes = await Note.find({uploaderId: userId}).sort({createdAt: -1});
// //         const notesWithCommentCount = await Promise.all(
// //           notes.map(async (note) => {
// //             const commentCount = await Comment.countDocuments({
// //               noteId: note._id,
// //               isDeleted: false,
// //             });
// //             return {
// //               ...note.toObject(),
// //               commentCount,
// //             };
// //           })
// //         );
// //         res.status(200).json(notesWithCommentCount);
// //     } catch (error) {
// //         console.error("Get my notes error:", error);
// //         res.status(500).json({ message: "Server error" });
// //     }
// // }


// const getMyNotes = async (req, res) => {
//   try {
//     const userId = req.user._id;

//     const notes = await Note.find({ uploaderId: userId }).sort({
//       createdAt: -1,
//     });

//     const noteIds = notes.map((note) => note._id);
//     const commentCounts = await Comment.aggregate([
//       { $match: { isDeleted: false, noteId: { $in: noteIds } } },
//       { $group: { _id: "$noteId", count: { $sum: 1 } } },
//     ]);

//     const countMap = commentCounts.reduce((acc, cur) => {
//       acc[cur._id.toString()] = cur.count;
//       return acc;
//     }, {});

//     const notesWithCommentCount = notes.map((note) => ({
//       ...note.toObject(),
//       commentCount: countMap[note._id.toString()] || 0,
//     }));

//     res.status(200).json(notesWithCommentCount);
//   } catch (error) {
//     console.error("Get my notes error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// module.exports = {
//     uploadNote,
//     getNotes,
//     getMyNotes
// }




// For ImageKit Integration
const Note = require("../models/Note");
const User = require("../models/User");
const Comment = require("../models/Comment");
const imagekit = require("../utils/imagekit");
const XPService = require("../services/xpService");


const uploadToImageKit = async (fileBuffer, fileName, folder = 'study_hub/notes') => {
  try {
    const response = await imagekit.upload({
      file: fileBuffer, 
      fileName: fileName,
      folder: folder,
      useUniqueFileName: true,
      tags: ['studyhub', 'notes']
    });
    
    return response;
  } catch (error) {
    throw new Error(`ImageKit upload failed: ${error.message}`);
  }
};

// const uploadNote = async (req, res) => {
//   try {
//     const { title, description, category } = req.body;
//     const userId = req.user._id;

//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     if (!title) {
//       return res.status(400).json({ message: "Title is required" });
//     }


//     let parsedCategory = {};
//     try {
//       parsedCategory = category ? JSON.parse(category) : {};
//     } catch (parseError) {
//       console.error("Category JSON parse error:", parseError);
//       parsedCategory = { subject: "General", examType: "semester" };
//     }


//     const uploadResult = await uploadToImageKit(
//       req.file.buffer,
//       `${Date.now()}_${req.file.originalname}`,
//       "study_hub/notes"
//     );


//     const note = await Note.create({
//       title,
//       description: description || "",
//       uploaderId: userId,
//       category: {
//         subject: parsedCategory.subject || "General",
//         topic: parsedCategory.topic || "",
//         examType: parsedCategory.examType || "semester",
//         class: parsedCategory.class || "",
//         university: parsedCategory.university || "",
//       },
//       file: {
//         imagekitId: uploadResult.fileId,
//         originalName: req.file.originalname,
//         fileUrl: uploadResult.url,
//         fileType: uploadResult.fileType,
//         fileSize: uploadResult.size,
//         thumbnail: uploadResult.thumbnailUrl || uploadResult.url,
//         height: uploadResult.height,
//         width: uploadResult.width,
//         format: uploadResult.fileType,
//         versionInfo: {
//           id: uploadResult.versionInfo?.id,
//           name: uploadResult.versionInfo?.name,
//         },
//         AITags: uploadResult.AITags || [],
//         isPrivateFile: uploadResult.isPrivateFile || false,
//       },
//       metadata: {
//         views: 0,
//         downloads: 0,
//         likes: 0,
//         dislikes: 0,
//         averageRating: 0,
//         tags: uploadResult.tags || [],
//       },
//       status: "pending",
//       processingStatus: "completed"
//     });


//     await User.findByIdAndUpdate(userId, {
//       $inc: { "stats.notesUploaded": 1 },
//     });

//     res.status(201).json({
//       message: "Note uploaded successfully",
//       note: {
//         _id: note._id,
//         title: note.title,
//         description: note.description,
//         category: note.category,
//         fileUrl: note.file.fileUrl,
//         createdAt: note.createdAt,
//         status: note.status,
//         file: {
//           fileSize: note.file.fileSize,
//           originalName: note.file.originalName,
//         },
//       },
//     });
//     const xpResult = await XPService.awardXP(
//       req.user.id,
//       "UPLOAD_NOTE",
//       null,
//       note._id,
//       `Uploaded note: ${note.title}`
//     );

//     await User.findByIdAndDelete(req.user.id, {
//       $inc: { "stats.notesUploaded": 1 },
//     });
      

//      res.status(201).json({
//        message: "Note uploaded successfully",
//        note,
//        gamification: {
//          xpEarned: xpResult.earnedXP,
//          newLevel: xpResult.newLevel,
//          leveledUp: xpResult.leveledUp,
//          newBadges: xpResult.newBadges,
//          completedChallenges: xpResult.completedChallenges,
//        },
//      });
//   } catch (error) {
//     console.error("Upload error:", error);
//     res.status(500).json({ message: "Upload failed", error: error.message });
//   }
// };

const uploadNote = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    let parsedCategory = {};
    try {
      parsedCategory = category ? JSON.parse(category) : {};
    } catch (parseError) {
      console.error("Category JSON parse error:", parseError);
      parsedCategory = { subject: "General", examType: "semester" };
    }

    const uploadResult = await uploadToImageKit(
      req.file.buffer,
      `${Date.now()}_${req.file.originalname}`,
      "study_hub/notes"
    );

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
        imagekitId: uploadResult.fileId,
        originalName: req.file.originalname,
        fileUrl: uploadResult.url,
        fileType: uploadResult.fileType,
        fileSize: uploadResult.size,
        thumbnail: uploadResult.thumbnailUrl || uploadResult.url,
        height: uploadResult.height,
        width: uploadResult.width,
        format: uploadResult.fileType,
        versionInfo: {
          id: uploadResult.versionInfo?.id,
          name: uploadResult.versionInfo?.name,
        },
        AITags: uploadResult.AITags || [],
        isPrivateFile: uploadResult.isPrivateFile || false,
      },
      metadata: {
        views: 0,
        downloads: 0,
        likes: 0,
        dislikes: 0,
        averageRating: 0,
        tags: uploadResult.tags || [],
      },
      status: "pending",
      processingStatus: "completed",
    });


    const xpResult = await XPService.awardXP(
      req.user.id,
      "UPLOAD_NOTE",
      null,
      note._id,
      `Uploaded note: ${note.title}`
    );


    await User.findByIdAndUpdate(userId, {
      $inc: { "stats.notesUploaded": 1 },
    });

    console.log("🎮 XP Result for upload:", xpResult);


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

      gamification: xpResult.success
        ? {
            xpEarned: xpResult.earnedXP,
            newXP: xpResult.newXP,
            newLevel: xpResult.newLevel,
            leveledUp: xpResult.leveledUp,
            newBadges: xpResult.newBadges || [],
            completedChallenges: xpResult.completedChallenges || [],
          }
        : null,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};


const getNotes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, subject } = req.query;
    let query = { status: 'approved' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'metadata.tags': { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (subject) {
      query['category.subject'] = subject;
    }

    const notes = await Note.find(query)
      .populate('uploaderId', 'username profile')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);


    const noteIds = notes.map(note => note._id);
    const commentCounts = await Comment.aggregate([
      { $match: { isDeleted: false, noteId: { $in: noteIds } } },
      { $group: { _id: "$noteId", count: { $sum: 1 } } }
    ]);

    const countMap = commentCounts.reduce((acc, cur) => {
      acc[cur._id.toString()] = cur.count;
      return acc;
    }, {});

    const notesWithCommentCount = notes.map(note => ({
      ...note.toObject(),
      commentCount: countMap[note._id.toString()] || 0
    }));

    const total = await Note.countDocuments(query);

    res.status(200).json({
      notes: notesWithCommentCount,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getMyNotes = async (req, res) => {
  try {
    const userId = req.user._id;

    const notes = await Note.find({ uploaderId: userId }).sort({ createdAt: -1 });
    

    const noteIds = notes.map(note => note._id);
    const commentCounts = await Comment.aggregate([
      { $match: { isDeleted: false, noteId: { $in: noteIds } } },
      { $group: { _id: "$noteId", count: { $sum: 1 } } }
    ]);

    const countMap = commentCounts.reduce((acc, cur) => {
      acc[cur._id.toString()] = cur.count;
      return acc;
    }, {});

    const notesWithCommentCount = notes.map(note => ({
      ...note.toObject(),
      commentCount: countMap[note._id.toString()] || 0
    }));

    res.status(200).json(notesWithCommentCount); // 
  } catch (error) {
    console.error("Get my notes error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const updateViews = async (req, res) => {
  try {
    const { id } = req.params;
    
    const note = await Note.findByIdAndUpdate(
      id,
      { 
        $inc: { 'metadata.views': 1 },
        $set: { 'metadata.lastViewedAt': new Date() }
      },
      { new: true }
    );
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    res.json({ views: note.metadata.views });
  } catch (error) {
    console.error('Update views error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const deleteFromImageKit = async (fileId) => {
  try {
    const result = await imagekit.deleteFile(fileId);
    return result;
  } catch (error) {
    console.error('ImageKit delete error:', error);
    throw error;
  }
};

module.exports = {
  uploadNote,
  getNotes,
  getMyNotes,
  updateViews, 
  deleteFromImageKit
};

