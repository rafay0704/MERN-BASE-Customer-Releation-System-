import mongoose from "mongoose";

const checkInSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user", // Reference the User model
    required: true,
    unique: true, // Ensure one document per user
  },
  checkIns: [
    {
      checkInTime: {
        type: Date,
        required: true,
      },
      _id: false, // Disable MongoDB's automatic _id creation for each check-in
    },
  ],
});

const CheckInModel = mongoose.model("checkIn", checkInSchema);

export default CheckInModel;
