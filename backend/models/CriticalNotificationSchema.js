import mongoose from "mongoose";

const CriticalNotificationSchema = new mongoose.Schema({
  type: { type: String, required: true }, // "commitment" or "critical highlight"
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "AllClients", required: true },
  customerName: { type: String, required: true },
  cssValue: { type: String }, // Include CSS value
  mouNo: { type: String }, // Include MOU value
  itemName: { type: String, required: true }, // Commitment or critical highlight name
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }, // Mark as unread by default
});

const CriticalNotificationModel = mongoose.model("CriticalNotification", CriticalNotificationSchema);

export default CriticalNotificationModel;
