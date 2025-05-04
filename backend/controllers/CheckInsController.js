import CheckInModel from "../models/CheckIns.js";
import UserModel from "../models/user.js";


// Daily Check-In Functionality
export const dailyCheckIn = async (req, res) => {
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

    // Find or create a document for the user's check-ins
    let userCheckInDoc = await CheckInModel.findOne({ userId });
    if (!userCheckInDoc) {
      userCheckInDoc = new CheckInModel({
        userId,
        checkIns: [],
      });
    }

    // Check if the user has already checked in today
    const alreadyCheckedInToday = userCheckInDoc.checkIns.some(
      (checkIn) => new Date(checkIn.checkInTime) >= todayStart && new Date(checkIn.checkInTime) <= todayEnd
    );

    if (alreadyCheckedInToday) {
      return res.status(400).json({ success: false, message: "You have already checked in today" });
    }

    // Add a new check-in for today
    userCheckInDoc.checkIns.push({
      checkInTime: new Date(),
    });

    await userCheckInDoc.save();

    // Emit the updated data (if you're using socket.io or a similar service)
    req.app.get("io").emit("checkInUpdated", {
      userId,
      data: {
        userId: user._id,
        name: user.name,
        checkIns: userCheckInDoc.checkIns.filter(
          (checkIn) => new Date(checkIn.checkInTime) >= todayStart && new Date(checkIn.checkInTime) <= todayEnd
        ),
      },
    });

    res.status(201).json({ success: true, message: "Check-in successful", checkIns: userCheckInDoc.checkIns });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
    console.error(error);
  }
};

// Get the user's check-in status
export const getCheckInStatus = async (req, res) => {
    try {
      const { userId } = req.params;
  
      const userCheckInDoc = await CheckInModel.findOne({ userId });
  
      if (!userCheckInDoc) {
        return res.status(200).json({
          success: true,
          checkIns: [],
          hasCheckedInToday: false,
        });
      }
  
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0); // Start of today at midnight
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999); // End of today just before midnight
  
      // Check if there's a check-in today
      const checkInToday = userCheckInDoc.checkIns.some(
        (checkIn) => new Date(checkIn.checkInTime) >= todayStart && new Date(checkIn.checkInTime) <= todayEnd
      );
  
      res.status(200).json({
        success: true,
        checkIns: userCheckInDoc.checkIns,
        hasCheckedInToday: checkInToday,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
  // Fetch check-ins for a user on a specific date
  export const getCheckInsByDate = async (req, res) => {
    try {
        const { date } = req.query; // Only date is required now

        if (!date) {
            return res.status(400).json({ success: false, message: "Date is required" });
        }

        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0); // Set the time to midnight of the selected date
        const nextDate = new Date(selectedDate);
        nextDate.setDate(selectedDate.getDate() + 1); // Set nextDate to the start of the following day

        // Find check-ins within the selected date range
        const checkInRecords = await CheckInModel.aggregate([
            {
                $unwind: "$checkIns" // Decompose the checkIns array
            },
            {
                $match: {
                    "checkIns.checkInTime": {
                        $gte: selectedDate,
                        $lt: nextDate
                    }
                }
            },
            {
                $group: {
                    _id: "$userId",
                    checkIns: { $push: "$checkIns" } // Group check-ins by userId
                }
            }
        ]);

        if (checkInRecords.length === 0) {
            return res.status(404).json({ success: true, data: [], message: "No check-ins found for the given date" });
        }

        // Fetch user details for all users who have check-ins
        const userIds = checkInRecords.map(record => record._id);
        const users = await UserModel.find({ _id: { $in: userIds } }, "_id name profilePicture");

        // Map user details for quick lookup
        const userMap = users.reduce((acc, user) => {
            acc[user._id] = user;
            return acc;
        }, {});

        // Build the final result by merging user details with check-in data
        const allCheckIns = checkInRecords.map(record => {
            const user = userMap[record._id];
            return {
                userId: user._id,
                name: user.name,
                profilePicture: user.profilePicture,
                checkIns: record.checkIns
            };
        });

        // Return the check-ins data for all users
        res.status(200).json({
            success: true,
            data: allCheckIns
        });
    } catch (error) {
        console.error("Error fetching check-ins by date:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
