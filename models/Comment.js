const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    text:{
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
    },
    noteId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Note",
        required: true,
        index:true
    },
    authorId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    parentCommentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        default: null,  
    },
    likes:{
        type: Number,
        default: 0,
    },
    likedBy:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    isEdited:{
        type: Boolean,
        default: false,
    },
    editedAt:{
        type: Date,
    },
    isDeleted:{
        type: Boolean,
        default: false,
    },
},{
    timestamps: true,
});

commentSchema.index({ noteId: 1, parentCommentId: 1, createdAt: -1 });
commentSchema.index({ likedBy: 1 });

module.exports = mongoose.model("Comment", commentSchema);