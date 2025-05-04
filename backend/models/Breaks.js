import mongoose from "mongoose";

const breakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user", // Reference the User model
    required: true,
    unique: true, // Ensure one document per user
  },
  breaks: [
    {
      startTime: {
        type: Date,
        required: true,
      },
      endTime: {
        type: Date, // Nullable initially
      },
      _id: false, // Disable MongoDB's automatic _id creation for each break
    },
  ],
});

const BreakModel = mongoose.model("break", breakSchema);

export default BreakModel;
