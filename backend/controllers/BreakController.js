import UserModel from "../models/user.js";
import BreakModel from "../models/Breaks.js";
import mongoose from "mongoose";


// Start a break
export const startBreak = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Start of today at midnight
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999); // End of today just before midnight
    
    // Ensure the user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Find or create a document for the user's breaks
    let userBreakDoc = await BreakModel.findOne({ userId });
    if (!userBreakDoc) {
      userBreakDoc = new BreakModel({
        userId,
        breaks: [],
      });
    }

    // Check if there's an active break for today
    const activeBreak = userBreakDoc.breaks.find((breakEntry) => 
      !breakEntry.endTime && new Date(breakEntry.startTime) >= todayStart && new Date(breakEntry.startTime) <= todayEnd
    );
    
    if (activeBreak) {
      return res.status(400).json({ success: false, message: "An active break is already in progress" });
    }

    // Add a new break for today
    userBreakDoc.breaks.push({
      startTime: new Date(),
    });

    await userBreakDoc.save();

    // Fetch updated user break data for today
    const updatedUserBreakDoc = await BreakModel.findOne({ userId }).populate({
      path: "userId",
      select: "name profilePicture",
    });

    // Emit the updated data
    req.app.get("io").emit("breakUpdated", {
      userId,
      data: {
        userId: updatedUserBreakDoc.userId._id,
        name: updatedUserBreakDoc.userId.name,
        profilePicture: updatedUserBreakDoc.userId.profilePicture,
        breaks: updatedUserBreakDoc.breaks.filter(b => new Date(b.startTime) >= todayStart && new Date(b.startTime) <= todayEnd),
        isOnBreak: !!updatedUserBreakDoc.breaks.find((b) => !b.endTime),
      },
    });

    res.status(201).json({ success: true, message: "Break started", breaks: updatedUserBreakDoc.breaks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
    console.error(error);
  }
};

 // End a break
 export const endBreak = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Start of today at midnight
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999); // End of today just before midnight

    // Find the user's breaks document
    const userBreakDoc = await BreakModel.findOne({ userId });
    if (!userBreakDoc) {
      return res.status(404).json({ success: false, message: "No break record found for this user" });
    }

    // Find the active break for today
    const activeBreak = userBreakDoc.breaks.find((breakEntry) => 
      !breakEntry.endTime && new Date(breakEntry.startTime) >= todayStart && new Date(breakEntry.startTime) <= todayEnd
    );
    if (!activeBreak) {
      return res.status(400).json({ success: false, message: "No active break found for this user" });
    }

    // End the break
    activeBreak.endTime = new Date();
    await userBreakDoc.save();

    // Fetch updated user break data
    const updatedUserBreakDoc = await BreakModel.findOne({ userId }).populate({
      path: "userId",
      select: "name profilePicture",
    });

    // Emit the updated data
    req.app.get("io").emit("breakUpdated", {
      userId,
      data: {
        userId: updatedUserBreakDoc.userId._id,
        name: updatedUserBreakDoc.userId.name,
        profilePicture: updatedUserBreakDoc.userId.profilePicture,
        breaks: updatedUserBreakDoc.breaks.filter(b => new Date(b.startTime) >= todayStart && new Date(b.startTime) <= todayEnd),
        isOnBreak: !!updatedUserBreakDoc.breaks.find((b) => !b.endTime),
      },
    });

    res.status(200).json({ success: true, message: "Break ended", breaks: updatedUserBreakDoc.breaks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
    console.error(error);
  }
};

  // Get the user's break status
// Get the user's break status
export const getBreakStatus = async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid or missing userId",
        });
      }

      
  
      const userBreakDoc = await BreakModel.findOne({ userId });
  
      if (!userBreakDoc) {
        // If no break record found, return an empty list of breaks
        return res.status(200).json({
          success: true,
          breaks: [],
          isOnBreak: false,
        });
      }
  
      // Check if there is an active break
      const activeBreak = userBreakDoc.breaks.find((b) => !b.endTime);
      res.status(200).json({
        success: true,
        breaks: userBreakDoc.breaks,
        isOnBreak: !!activeBreak,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
  // Get all users' break status (Admin only)
 

  
 export const getBreaksByDate = async (req, res) => {
    try {
        const { startDate, endDate } = req.query; // Accept start and end dates from query params

        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, message: "Start date and end date are required" });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Set the end date to the end of the day

        // Fetch breaks within the specified date range
        const breakRecords = await BreakModel.aggregate([
            {
                $unwind: "$breaks"
            },
            {
                $match: {
                    "breaks.startTime": { $gte: start, $lt: end }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: "$userDetails"
            },
            {
                $group: {
                    _id: "$userId",
                    name: { $first: "$userDetails.name" },
                    profilePicture: { $first: "$userDetails.profilePicture" },
                    breaks: {
                        $push: "$breaks"
                    },
                    isOnBreak: {
                        $max: {
                            $cond: [
                                { $not: "$breaks.endTime" }, true, false
                            ]
                        }
                    }
                }
            }
        ]);

        const userBreaks = breakRecords.map(record => ({
            userId: record._id,
            name: record.name,
            profilePicture: record.profilePicture,
            breaks: record.breaks,
            isOnBreak: record.isOnBreak
        }));

        res.status(200).json({
            success: true,
            data: userBreaks
        });
    } catch (error) {
        console.error("Error fetching breaks by date:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

