import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    stats: {
      chatsCreated: {
        type: Number,
        default: 0,
      },
      chatsDeleted: {
        type: Number,
        default: 0,
      },
      filesUploaded: {
        type: Number,
        default: 0,
      },
    },

    firstTime: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User ||
  mongoose.model("User", UserSchema);