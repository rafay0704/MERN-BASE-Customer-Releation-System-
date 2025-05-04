import moment from "moment";
import AllClientsModel from "../models/AllClients.js";
import CriticalClientBatchModel from "../models/CriticalClientBatchSchema.js";
import UserModel from "../models/user.js";

// Generate Critical Batch API
export const generateCriticalBatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);

    if (!user || user.role !== "user" || user.designation !== "CSS") {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    // Get all clients with Stage "Active" and Flag "red" for this CSS user
    const clients = await AllClientsModel.find({ CSS: user.name, Stage: "Active", Flag: "red" });

    if (clients.length === 0) {
      return res.status(404).json({ success: false, message: "No critical clients found" });
    }

    // Retrieve or initialize critical client batch data for the user
    let criticalClientBatch = await CriticalClientBatchModel.findOne({ cssUser: user.name });
    if (!criticalClientBatch) {
      criticalClientBatch = new CriticalClientBatchModel({
        cssUser: user.name,
        cycles: [{ cycleNumber: 1, batches: [] }]
      });
    }

    // Get the current cycle
    let currentCycle = criticalClientBatch.cycles[criticalClientBatch.cycles.length - 1];

    // Get the last batch
    const lastBatch = currentCycle.batches[currentCycle.batches.length - 1];

    // Check if any medium or comment is missing in the last batch
    if (lastBatch) {
      const clientsWithoutMedium = lastBatch.mous.filter(mou => !mou.medium);
      const clientsWithoutComments = [];
      const today = moment().startOf("day");

      for (const mou of lastBatch.mous) {
        const foundClient = await AllClientsModel.findOne({ Mou_no: mou.mou });
        const commentToday = foundClient?.LatestComments.find(comment =>
          moment(comment.timestamp).isSame(today, "day") && comment.name === user.name
        );
        if (!commentToday) {
          clientsWithoutComments.push(foundClient.CustomerName);
        }
      }

      // If any client doesn't have medium or comment, return a message
      if (clientsWithoutMedium.length > 0 || clientsWithoutComments.length > 0) {
        const missingMediumMous = clientsWithoutMedium.map(client => client.mou).join(", ");
        const missingCommentsClients = clientsWithoutComments.join(", ");
        const errorMessages = [];

        if (missingMediumMous) {
          errorMessages.push(`Please update the medium for the following MOU(s): ${missingMediumMous}`);
        }
        if (missingCommentsClients) {
          errorMessages.push(`Comments not found for: ${missingCommentsClients}`);
        }

        return res.status(400).json({ success: false, message: errorMessages.join(". ") });
      }
    }

    // Get previously selected MOUs from all batches in the current cycle
    const previousMous = currentCycle.batches.flatMap(batch => batch.mous.map(m => m.mou));

    // Filter remaining MOUs that haven't been used yet
    const remainingMous = clients.map(client => ({
      mou: client.Mou_no
    })).filter(({ mou }) => !previousMous.includes(mou));

    // If all MOUs have been used, start a new cycle
    if (remainingMous.length === 0) {
      const newCycleNumber = currentCycle.cycleNumber + 1;
      criticalClientBatch.cycles.push({ cycleNumber: newCycleNumber, batches: [] });
      currentCycle = criticalClientBatch.cycles[criticalClientBatch.cycles.length - 1];
    }

    // Sort remaining clients to get top and bottom clients
    let newBatchMous = [];
    
    // If there are fewer than 5 remaining MOUs, use all remaining
    if (remainingMous.length <= 5) {
      newBatchMous = [...remainingMous]; // Add all remaining MOUs
    } else {
      // Otherwise, take the top 2 clients and bottom 3 clients
      const topClients = remainingMous.slice(0, 2);  // First 2 clients
      const bottomClients = remainingMous.slice(-3); // Last 3 clients
      newBatchMous = [...topClients, ...bottomClients];
    }

    // Add the new batch to the current cycle
    currentCycle.batches.push({
      batchDate: new Date(),
      mous: newBatchMous
    });

    await criticalClientBatch.save();

    res.status(200).json({ success: true, batch: newBatchMous });
  } catch (error) {
    console.error("Error generating critical batch:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

  

// Fetch Last Critical Batch API
export const getLastCriticalBatch = async (req, res) => {
  try {
      // Step 1: Fetch the current user (CSS user) from the request
      const userId = req.user.id;
      const user = await UserModel.findById(userId);

      if (!user || user.role !== "user" || user.designation !== "CSS") {
          return res.status(403).json({ success: false, message: "Unauthorized access" });
      }

      // Step 2: Fetch the latest critical client batch based on CSS user
      const criticalClientBatch = await CriticalClientBatchModel.findOne({ cssUser: user.name });
      if (!criticalClientBatch || criticalClientBatch.cycles.length === 0) {
          return res.status(404).json({ success: false, message: "No critical batches found" });
      }

      const lastCycle = criticalClientBatch.cycles[criticalClientBatch.cycles.length - 1];
      const lastBatch = lastCycle.batches[lastCycle.batches.length - 1];

      if (!lastBatch) {
          return res.status(404).json({ success: false, message: "No batches found in the current cycle" });
      }

      // Step 3: Fetch client details based on MOU numbers in the last batch
      const clientMous = lastBatch.mous.map(item => item.mou);
      const clients = await AllClientsModel.find({ Mou_no: { $in: clientMous } });

      // Step 4: Fetch only the latest comment and medium for each client
      const clientDetails = await Promise.all(clients.map(async (client) => {
        // Get the latest comment from the LatestComments array by sorting by timestamp
        const latestComment = client.LatestComments.sort((a, b) => b.timestamp - a.timestamp)[0];  // Sort descending
      
        // Find the medium from the batch
        const mouData = lastBatch.mous.find(mouItem => mouItem.mou === client.Mou_no);
        const medium = mouData ? mouData.medium : null;  // Use null if no medium is found
      
        return {
          Mou_no: client.Mou_no,
          CustomerName: client.CustomerName,
          Date: client.Date,
          VisaCategory: client.VisaCatagory,
          Phone: client.Phone,
          Email: client.Email,
          Status: client.Status,
          Language: client.Language,
          LatestComment: latestComment ? latestComment.comment : "No comments available",  // Default if no comment
          CommentTimestamp: latestComment ? latestComment.timestamp : null,  // Include timestamp
          CommentBy: latestComment ? latestComment.name : "No name available",  // Include name
          Medium: medium || "Select Medium"  // Default to "Select Medium" if no medium is found
        };
      }));
      // Step 5: Return the batch information along with client details
      res.status(200).json({
          success: true,
          batch: lastBatch.mous,
          batchDate: lastBatch.batchDate,
          clients: clientDetails  // Include the client details along with batch
      });
  } catch (error) {
      console.error("Error fetching last critical batch:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



// Update Medium for a Critical Client API
export const updateCriticalClientMedium = async (req, res) => {
    const { Mou_no } = req.params;
    const { medium } = req.body;

    try {
        const criticalClientBatch = await CriticalClientBatchModel.findOne({
            "cycles.batches.mous.mou": Mou_no
        });

        if (!criticalClientBatch) {
            return res.status(404).json({ success: false, message: "Client not found" });
        }

        const currentCycle = criticalClientBatch.cycles[criticalClientBatch.cycles.length - 1];
        const lastBatch = currentCycle.batches[currentCycle.batches.length - 1];

        const mouIndex = lastBatch.mous.findIndex(mou => mou.mou === Mou_no);

        if (mouIndex === -1) {
            return res.status(404).json({ success: false, message: "MOU not found in the last batch" });
        }

        lastBatch.mous[mouIndex].medium = medium;
        await criticalClientBatch.save();

        res.json({ success: true, message: "Medium updated successfully" });
    } catch (error) {
        console.error("Error updating critical client medium:", error);
        res.status(500).json({ success: false, message: "Failed to update medium" });
    }
};

// Fetch User's Critical Client Stats API
export const getUserCriticalClientStats = async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await UserModel.findById(userId);
  
      if (!user || user.role !== "user" || user.designation !== "CSS") {
        return res.status(403).json({ success: false, message: "Unauthorized access" });
      }
  
      // Find the critical client batch for this user
      const criticalClientBatch = await CriticalClientBatchModel.findOne({ cssUser: user.name });
      if (!criticalClientBatch || criticalClientBatch.cycles.length === 0) {
        return res.status(404).json({ success: false, message: "No critical batches found" });
      }
  
      const currentCycle = criticalClientBatch.cycles[criticalClientBatch.cycles.length - 1];
  
      // Get the last batch date in the current cycle
      const lastBatch = currentCycle.batches[currentCycle.batches.length - 1];
      const lastBatchDate = lastBatch ? lastBatch.batchDate : null;
  
      // Get the total count of clients in the "Active" and "red" stage for this user
      const totalClients = await AllClientsModel.countDocuments({ CSS: user.name, Stage: "Active", Flag: "red" });
  
      // Get the number of MOUs in the current cycle's last batch
      const currentBatchCount = lastBatch ? lastBatch.mous.length : 0;  // Count of clients in the current batch
  
      // Get the previously selected MOUs to ensure we don't reuse clients
      const previousMous = currentCycle.batches.flatMap(batch => batch.mous.map(m => m.mou));
  
      // Get remaining clients for the next batch (new clients + old clients)
      const remainingClients = await AllClientsModel.find({
        CSS: user.name,
        Stage: "Active",
        Flag: "red",
        Mou_no: { $nin: previousMous }
      });
  
      // Sort remaining clients into "new" and "old" based on some criterion
      // Assuming "new" clients are the first 2 in the remaining clients and "old" clients are the last 3
      const sortedRemainingClients = remainingClients;  // Customize this sorting as needed
      const newClients = sortedRemainingClients.slice(0, 2);  // First 2 new clients
      const oldClients = sortedRemainingClients.slice(-3);  // Last 3 old clients
  
      // The number of clients in the next batch is fixed at 5 (2 new + 3 old)
  
      // Calculate the total number of cycles
      const cycleCount = criticalClientBatch.cycles.length;
  
      // Prepare and return the stats response
      return res.status(200).json({
        success: true,
        stats: {
          totalClients,
          currentBatchCount,
          remainingClients: remainingClients.length,
          cycleCount,
          lastBatchDate // Add the last batch date in the response
        }
      });
  
    } catch (error) {
      console.error("Error fetching critical client stats:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
  
  export const getAllUsersCriticalClientStats = async (req, res) => {
    try {
      // Fetch all clients in 'Active' stage with 'red' flag and assigned to CSS users
      const activeClients = await AllClientsModel.aggregate([
        { 
          $match: { 
            Stage: "Active",  // Only clients in the 'Active' stage
            Flag: "red" // Red flag clients
          }
        },
        { 
          $group: { 
            _id: "$CSS",  // Group by CSS
            totalClients: { $sum: 1 },
            mouNumbers: { $push: "$Mou_no" } 
          }
        }
      ]);
  
      // Create a map of active CSS users with their clients count and Mou_no list
      const activeCSSStatsMap = activeClients.reduce((acc, client) => {
        acc[client._id] = { totalClients: client.totalClients, mouNumbers: client.mouNumbers };
        return acc;
      }, {});
  
      // Fetch CSS users with role 'user' and designation 'CSS'
      const users = await UserModel.find({ role: "user", designation: "CSS", name: { $in: Object.keys(activeCSSStatsMap) } });
  
      if (users.length === 0) {
        return res.status(404).json({ success: false, message: "No active CSS users found" });
      }
  
      // Fetch CriticalClientBatch data for all relevant CSS users in bulk
      const criticalBatches = await CriticalClientBatchModel.find({ cssUser: { $in: users.map(user => user.name) } });
      const criticalBatchesMap = criticalBatches.reduce((acc, batch) => {
        acc[batch.cssUser] = batch;
        return acc;
      }, {});
  
      // Build the stats for each user
      const stats = users.map(user => {
        const userName = user.name;
        const clientStats = activeCSSStatsMap[userName] || { totalClients: 0, mouNumbers: [] };
        const criticalBatch = criticalBatchesMap[userName];
  
        let currentBatchCount = 0;
        let remainingClients = clientStats.totalClients;
        let cycleCount = 0;
        let lastBatchDate = null;
  
        if (criticalBatch && criticalBatch.cycles.length > 0) {
          const lastCycle = criticalBatch.cycles[criticalBatch.cycles.length - 1];
          const lastBatch = lastCycle.batches[lastCycle.batches.length - 1];
          lastBatchDate = lastBatch ? lastBatch.batchDate : null;
          currentBatchCount = lastBatch ? lastBatch.mous.length : 0;
  
          // Calculate remaining clients by filtering out already used Mou_no from the critical batch
          const usedMous = criticalBatch.cycles.flatMap(cycle =>
            cycle.batches.flatMap(batch => batch.mous.map(mou => mou.mou))
          );
          remainingClients = clientStats.mouNumbers.filter(mou => !usedMous.includes(mou)).length;
  
          cycleCount = criticalBatch.cycles.length;
        }
  
        return {
          name: userName,
          totalClients: clientStats.totalClients,
          currentBatchCount,
          remainingClients,
          cycleCount,
          lastBatchDate
        };
      });
  
      return res.status(200).json({ success: true, stats });
    } catch (error) {
      console.error("Error fetching all users' stats:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
  

  
// Updated function to process the POST request
export const getCriticalBatchDataByDateAndUser = async (req, res) => {
    const { selectedDate, cssUser } = req.body; // Expect date and cssUser from the request body
  
    try {
      const user = await UserModel.findOne({ name: cssUser });
      if (!user || user.role !== "user" || user.designation !== "CSS") {
        return res.status(403).json({ success: false, message: "Unauthorized access" });
      }
  
      const criticalClientBatch = await CriticalClientBatchModel.findOne({ cssUser });
      if (!criticalClientBatch || criticalClientBatch.cycles.length === 0) {
        return res.status(404).json({ success: false, message: "No critical batches found" });
      }
  
      const selectedBatch = criticalClientBatch.cycles
        .flatMap(cycle => cycle.batches)
        .find(batch => moment(batch.batchDate).isSame(selectedDate, 'day'));
  
      if (!selectedBatch) {
        return res.status(404).json({ success: false, message: "No batch found for the selected date" });
      }
  
      const clientMous = selectedBatch.mous.map(item => item.mou);
      const clients = await AllClientsModel.find({ Mou_no: { $in: clientMous } });
  
      const clientDetails = await Promise.all(clients.map(async (client) => {
        const latestComment = client.LatestComments.sort((a, b) => b.timestamp - a.timestamp)[0]; 
  
        return {
          Mou_no: client.Mou_no,
          CustomerName: client.CustomerName,
          Date: client.Date,
          VisaCategory: client.VisaCategory,
          Phone: client.Phone,
          Email: client.Email,
          Branch: client.BranchLocation,
          LatestComment: latestComment ? latestComment.comment : "No comments available"
        };
      }));
  
      res.status(200).json({
        success: true,
        batch: selectedBatch.mous,
        batchDate: selectedBatch.batchDate,
        clients: clientDetails
      });
    } catch (error) {
      console.error("Error fetching batch data:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };