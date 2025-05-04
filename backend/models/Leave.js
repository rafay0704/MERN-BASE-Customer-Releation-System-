// models/Leave.js
import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
}, { timestamps: true });

const LeaveModel = mongoose.model("Leave", leaveSchema);
export default LeaveModel;