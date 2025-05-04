import CriticalNotificationModel from "../models/CriticalNotificationSchema.js";

// Fetch all notifications for admin
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await CriticalNotificationModel.find().sort({ timestamp: -1 });
    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// Fetch notifications for users where cssValue matches the user's name
export const getNotificationsByCssValue = async (req, res) => {
    try {
      const { name } = req.params; // Get the user's name from request params
  
      // Fetch notifications where the `cssValue` matches the user's `name`
      const notifications = await CriticalNotificationModel.find({ cssValue: name }).sort({ timestamp: -1 });
  
      return res.status(200).json({ success: true, notifications });
    } catch (error) {
      console.error("Error fetching notifications for cssValue:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
  
  // Controller to update the notification read/unread status
export const updateNotificationStatus = async (req, res) => {
    try {
      const { notificationId } = req.params; // Get the notification ID from request params
      const { readStatus } = req.body; // Read status (true or false)
  
      // Find the notification by its ID and update its read status
      const updatedNotification = await CriticalNotificationModel.findByIdAndUpdate(
        notificationId,
        { read: readStatus },
        { new: true } // Return the updated notification
      );
  
      if (!updatedNotification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }
  
      return res.status(200).json({
        success: true,
        message: "Notification status updated successfully",
        notification: updatedNotification,
      });
    } catch (error) {
      console.error("Error updating notification status:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };

  // Clear all read notifications (admin only)
  export const clearReadNotifications = async (req, res) => {
    try {
      // Delete all notifications where `read` is true
      const result = await CriticalNotificationModel.deleteMany({ read: true });
  
      return res.status(200).json({
        success: true,
        message: `${result.deletedCount} read notifications cleared.`,
      });
    } catch (error) {
      console.error("Error clearing read notifications:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };
  