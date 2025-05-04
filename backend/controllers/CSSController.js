import AllClientsModel from '../models/AllClients.js';
import UserModel from '../models/user.js';
import DailyClientsModel from '../models/DailyClients.js';
import moment from 'moment'; // For date handling


// Get clients related to the logged-in CSS user
const getClientsForCSS = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);

    if (user && user.role === 'user' && user.designation === 'CSS') {
      // Fetch clients assigned to this CSS user, excluding those with Status "Endorsed" or "Visa Granted"
      const clients = await AllClientsModel.find({
        CSS: user.name,
        Stage: "Active"      });


      return res.status(200).json({ success: true, clients });
    } else {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }
  } catch (error) {
    console.error('Error fetching clients for CSS:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


// Get details of a single client by Mou_no, ensuring the client belongs to the logged-in CSS user
const getClientDetailsForCSS = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // Find the client by Mou_no and check if the CSS field matches the logged-in user's name
        const client = await AllClientsModel.findOne({ Mou_no: id, CSS: user.name });
        
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found or unauthorized access' });
        }

        res.status(200).json({ success: true, client });
    } catch (error) {
        console.error('Error fetching client details for CSS:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};





const generateBatch = async (req, res) => {
  try {
      const userId = req.user.id;
      const user = await UserModel.findById(userId);

      if (!user || user.role !== 'user' || user.designation !== 'CSS') {
          return res.status(403).json({ success: false, message: 'Unauthorized access' });
      }

      // Get today's date in a suitable format for comparison
      const today = moment().startOf('day');

      // Get all clients for this CSS user
      const clients = await AllClientsModel.find({ 
        CSS: user.name,
        Stage: "Active",
        Flag: { $ne: "red" } // Ignore clients with Flag set to "red"
      });
      

      // Retrieve or initialize daily client data for the user
      let dailyClient = await DailyClientsModel.findOne({ cssUser: user.name });
      if (!dailyClient) {
          dailyClient = new DailyClientsModel({
              cssUser: user.name,
              cycles: [{ cycleNumber: 1, batches: [] }]
          });
      }

      // Get the current cycle
      let currentCycle = dailyClient.cycles[dailyClient.cycles.length - 1];

      // Check if there are existing batches
      const lastBatch = currentCycle.batches[currentCycle.batches.length - 1];

      // If no last batch exists, this is the first batch to generate
      if (!lastBatch) {
          // No batches have been created yet
          // Proceed to generate the first batch
          const remainingMous = clients.map(client => ({
              mou: client.Mou_no,
              customerName: client.CustomerName
          }));

          // Select the first 12 and the last 13, up to a total of 25
          const newBatchMous = remainingMous.length <= 20
              ? remainingMous
              : [
                  ...remainingMous.slice(0, 10),  // First 12 MOUs
                  ...remainingMous.slice(-10)     // Last 13 MOUs
              ].slice(0, 20);

          // Add the new batch to the current cycle
          currentCycle.batches.push({
              batchDate: new Date(), // Set to current date for the first batch
              mous: newBatchMous
          });

          await dailyClient.save();
          return res.status(200).json({ success: true, batch: newBatchMous });
      }

      // If we reach here, it means there is a last batch to check for comments
      // Check if each client in the last batch has a comment from today
      const clientsWithoutComments = [];
      for (const client of lastBatch.mous) {
          const foundClient = await AllClientsModel.findOne({ Mou_no: client.mou });
          const commentToday = foundClient?.LatestComments.find(comment => 
              moment(comment.timestamp).isSame(today, 'day') && comment.name === user.name
          );

          if (!commentToday) {
              clientsWithoutComments.push(foundClient.CustomerName);
          }
      }

      if (clientsWithoutComments.length > 0) {
          const clientNames = clientsWithoutComments.join(', ');
          return res.status(400).json({ success: false, message: `Comments not found for: ${clientNames}` });
      }

      // Get previously selected MOUs from all batches in the current cycle
      const previousMous = currentCycle.batches.flatMap(batch => batch.mous.map(m => m.mou));

      // Filter remaining MOUs that haven't been used yet
      const remainingMous = clients.map(client => ({
          mou: client.Mou_no,
          customerName: client.CustomerName
      })).filter(({ mou }) => !previousMous.includes(mou));

      // If all MOUs have been used, start a new cycle
      if (remainingMous.length === 0) {
          const newCycleNumber = currentCycle.cycleNumber + 1;
          dailyClient.cycles.push({ cycleNumber: newCycleNumber, batches: [] });
          currentCycle = dailyClient.cycles[dailyClient.cycles.length - 1];
      }

      // Generate the new batch
      let newBatchMous = [];
      if (remainingMous.length <= 20) {
          newBatchMous = remainingMous;
      } else {
          newBatchMous = [
              ...remainingMous.slice(0, 10),  // First 12 MOUs
              ...remainingMous.slice(-10)     // Last 13 MOUs
          ].slice(0, 20);
      }

      // Update the last batch date to the current date before creating a new batch
      lastBatch.batchDate = new Date(); // Set last batch date to current date

      // Add the new batch to the current cycle
      currentCycle.batches.push({
          batchDate: new Date(),
          mous: newBatchMous
      });

      await dailyClient.save();
      res.status(200).json({ success: true, batch: newBatchMous });
  } catch (error) {
      console.error('Error generating batch:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};



// Helper function to get the current order of batch completion
const getBatchCompletionOrder = async () => {
  const allUsers = await UserModel.find({ role: 'user', designation: 'CSS' });
  
  const usersOrder = [];  // An array to hold users and their batch completion timestamps

  for (const user of allUsers) {
      const dailyClient = await DailyClientsModel.findOne({ cssUser: user.name });
      if (dailyClient) {
          const lastCycle = dailyClient.cycles[dailyClient.cycles.length - 1];
          const lastBatch = lastCycle.batches[lastCycle.batches.length - 1];
          if (lastBatch) {
              usersOrder.push({ user: user.name, completedAt: lastBatch.batchDate });
          }
      }
  }

  // Sort users by the time they finished their batch
  usersOrder.sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

  return usersOrder.map((entry, index) => ({
      position: index + 1,
      user: entry.user
  }));
};




// const generateBatch = async (req, res) => {
//   try {
//       const userId = req.user.id;
//       const user = await UserModel.findById(userId);

//       if (!user || user.role !== 'user' || user.designation !== 'CSS') {
//           return res.status(403).json({ success: false, message: 'Unauthorized access' });
//       }

//       // Get today's date in a suitable format for comparison
//       const today = moment().startOf('day');


//       //  // Get all eligible clients for this CSS user by calling getClientsForCSS logic
//       //  const clientResponse = await getClientsForCSS(req, res); // Call getClientsForCSS
//       //  if (!clientResponse.success) {
//       //      return res.status(400).json({ success: false, message: 'Failed to retrieve clients for CSS' });
//       //  }


//       //  const clients = clientResponse.clients;


//       // Get all clients for this CSS user
//       // const clients = await AllClientsModel.find({ CSS: user.name });


//       const clients = await AllClientsModel.find({
//         CSS: user.name,
//         Stage: "Active"      });

//       // Retrieve or initialize daily client data for the user
//       let dailyClient = await DailyClientsModel.findOne({ cssUser: user.name });
//       if (!dailyClient) {
//           dailyClient = new DailyClientsModel({
//               cssUser: user.name,
//               cycles: [{ cycleNumber: 1, batches: [] }]
//           });
//       }

//       // Get the current cycle
//       let currentCycle = dailyClient.cycles[dailyClient.cycles.length - 1];

//       // Check if there are existing batches
//       const lastBatch = currentCycle.batches[currentCycle.batches.length - 1];

//       // If no last batch exists, this is the first batch to generate
//       if (!lastBatch) {
//           // No batches have been created yet
//           // Proceed to generate the first batch
//           const remainingMous = clients.map(client => ({
//               mou: client.Mou_no,
//               customerName: client.CustomerName
//           }));

//           // Select the first 12 and the last 13, up to a total of 25
//           const newBatchMous = remainingMous.length <= 25
//               ? remainingMous
//               : [
//                   ...remainingMous.slice(0, 12),  // First 12 MOUs
//                   ...remainingMous.slice(-13)     // Last 13 MOUs
//               ].slice(0, 25);

//           // Add the new batch to the current cycle
//           currentCycle.batches.push({
//               batchDate: new Date(), // Set to current date for the first batch
//               mous: newBatchMous
//           });

//           await dailyClient.save();
//           return res.status(200).json({ success: true, batch: newBatchMous });
//       }

//       // If we reach here, it means there is a last batch to check for comments
//       // Check if each client in the last batch has a comment from today
//       const clientsWithoutComments = [];
//       for (const client of lastBatch.mous) {
//           const foundClient = await AllClientsModel.findOne({ Mou_no: client.mou });
//           const commentToday = foundClient?.LatestComments.find(comment => 
//               moment(comment.timestamp).isSame(today, 'day') && comment.name === user.name
//           );

//           if (!commentToday) {
//               clientsWithoutComments.push(foundClient.CustomerName);
//           }
//       }

//       if (clientsWithoutComments.length > 0) {
//           const clientNames = clientsWithoutComments.join(', ');
//           return res.status(400).json({ success: false, message: `Comments not found for: ${clientNames}` });
//       }

//       // Get previously selected MOUs from all batches in the current cycle
//       const previousMous = currentCycle.batches.flatMap(batch => batch.mous.map(m => m.mou));

//       // Filter remaining MOUs that haven't been used yet
//       const remainingMous = clients.map(client => ({
//           mou: client.Mou_no,
//           customerName: client.CustomerName
//       })).filter(({ mou }) => !previousMous.includes(mou));

//       // If all MOUs have been used, start a new cycle
//       if (remainingMous.length === 0) {
//           const newCycleNumber = currentCycle.cycleNumber + 1;
//           dailyClient.cycles.push({ cycleNumber: newCycleNumber, batches: [] });
//           currentCycle = dailyClient.cycles[dailyClient.cycles.length - 1];
//       }

//       // Generate the new batch
//       let newBatchMous = [];
//       if (remainingMous.length <= 25) {
//           newBatchMous = remainingMous;
//       } else {
//           newBatchMous = [
//               ...remainingMous.slice(0, 12),  // First 12 MOUs
//               ...remainingMous.slice(-13)     // Last 13 MOUs
//           ].slice(0, 25);
//       }

//       // Update the last batch date to the current date before creating a new batch
//       lastBatch.batchDate = new Date(); // Set last batch date to current date

//       // Add the new batch to the current cycle
//       currentCycle.batches.push({
//           batchDate: new Date(),
//           mous: newBatchMous
//       });

//       await dailyClient.save();
//       res.status(200).json({ success: true, batch: newBatchMous });
//   } catch (error) {
//       console.error('Error generating batch:', error);
//       res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// };



  const getLastBatchForCSS = async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await UserModel.findById(userId);
  
      if (!user || user.role !== 'user' || user.designation !== 'CSS') {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
      }
  
      const dailyClient = await DailyClientsModel.findOne({ cssUser: user.name });
      if (!dailyClient || dailyClient.cycles.length === 0) {
        return res.status(404).json({ success: false, message: 'No batches found' });
      }
  
      const lastCycle = dailyClient.cycles[dailyClient.cycles.length - 1];
      const lastBatch = lastCycle.batches[lastCycle.batches.length - 1];
  
      res.status(200).json({
        success: true,
        batch: lastBatch.mous,
        batchDate: lastBatch.batchDate
        
        
      });
    } catch (error) {
      console.error('Error fetching last batch for CSS:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };
  

  const getBatchesByDate = async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      const userId = req.user.id;
  
      // Verify the user is a CSS user
      const user = await UserModel.findById(userId);
      if (!user || user.role !== 'user' || user.designation !== 'CSS') {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
      }
  
      // Parse and format dates for comparison
      const start = moment(startDate).startOf('day').toDate();
      const end = moment(endDate).endOf('day').toDate();
  
      // Find daily client data with batches within the date range for the specific CSS user
      const dailyClient = await DailyClientsModel.findOne({ cssUser: user.name });
      if (!dailyClient) {
        return res.status(404).json({ success: false, message: 'No batches found' });
      }
  
      // Filter batches in all cycles based on date range
      const filteredBatches = dailyClient.cycles.flatMap((cycle) =>
        cycle.batches.filter(
          (batch) => batch.batchDate >= start && batch.batchDate <= end
        )
      );
  
      // Send response
      res.status(200).json({ success: true, batches: filteredBatches });
    } catch (error) {
      console.error('Error fetching batches by date:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };

//   const getBatchesByDate = async (req, res) => {
//     try {
//         const { startDate, endDate } = req.body;
//         const userId = req.user.id;
//         const user = await UserModel.findById(userId);

//         if (!user || user.role !== 'user' || user.designation !== 'CSS') {
//             return res.status(403).json({ success: false, message: 'Unauthorized access' });
//         }

//         const dailyClient = await DailyClientsModel.findOne({ cssUser: user.name });
//         if (!dailyClient) {
//             return res.status(404).json({ success: false, message: 'No data found' });
//         }

//         const formattedStartDate = moment(startDate).startOf('day');
//         const formattedEndDate = moment(endDate).endOf('day');

//         const batches = dailyClient.cycles.flatMap(cycle =>
//           cycle.batches.filter(batch =>
//               moment(batch.batchDate).isBetween(formattedStartDate, formattedEndDate, null, '[]')
//           ).map(batch => {
//               return batch.mous.map(mou => ({
//                   ...mou,
//                   batchDate: batch.batchDate // Include batch date
//               }));
//           })
//       ).flat(); // Flatten the array after mapping
      

//         if (batches.length === 0) {
//             return res.status(404).json({ success: false, message: 'No batches found for the selected date range' });
//         }

//         res.status(200).json({ success: true, batches });
//     } catch (error) {
//         console.error('Error fetching batches by date:', error);
//         res.status(500).json({ success: false, message: 'Internal Server Error' });
//     }
// };





// Get list of all CSS users generating their batches with details
const getAllCSSBatchInfo = async (req, res) => {
    try {
      // Fetch all CSS users who are generating batches
      const allDailyClients = await DailyClientsModel.find();
  
      // Initialize an array to store results
      const cssBatchInfo = [];
  
      for (const dailyClient of allDailyClients) {
        const cssUser = dailyClient.cssUser;
  
        // Fetch all clients associated with this CSS user from AllClientsModel
     // Filter clients to exclude specific stages
const filteredClients = await AllClientsModel.find({
    CSS: cssUser,
        Stage: "Active"
});

// Total count should only include filtered clients
const totalClientsCount = filteredClients.length;



        // Calculate remaining clients count (MOUs not yet saved in any batch)
        const usedMous = dailyClient.batches.flatMap(batch => batch.mous);
        const remainingClientsCount = allClients.filter(
          client => !usedMous.includes(client.Mou_no)
        ).length;
  
        // Get the last batch info
        const lastBatch = dailyClient.batches[dailyClient.batches.length - 1];
        const batchTimestamp = lastBatch ? lastBatch.batchDate : null;
        const lastBatchClientCount = lastBatch ? lastBatch.mous.length : 0;
  
        // Current index of the batch
        const currentBatchIndex = dailyClient.batches.length;
  
        // Calculate total used clients count
        const totalUsedClientsCount = usedMous.length;
  
        // Calculate batches required for remaining clients (assuming batch size is 25)
        const batchSize = 25;
        const batchesToCompile = Math.ceil(remainingClientsCount / batchSize);
  
        // Determine the size of the next batch (if remaining clients exist)
        const nextBatchSize = Math.min(remainingClientsCount, batchSize);
  
        // Push the info for this CSS user
        cssBatchInfo.push({
          cssUser,
          totalClientsCount,
          totalUsedClientsCount,
          remainingClientsCount,
          totalBatchesCreated: currentBatchIndex,
          lastBatchClientCount,
          batchTimestamp,
          currentBatchIndex,
          batchesToCompile,
          nextBatchSize
        });
      }
  
      // Send the response with aggregated data
      res.status(200).json({ success: true, data: cssBatchInfo });
    } catch (error) {
      console.error('Error fetching CSS batch info:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };


  const getClientDetailsByMouAndName = async (req, res) => {
    try {
      const { Mou_no, CustomerName } = req.body; // Get Mou_no and CustomerName from request body
      const userId = req.user.id;
      
      // Find the user to check role and designation
      const user = await UserModel.findById(userId);
      if (!user || (user.role !== 'user' && !(user.role === 'admin'))) {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
      }
  
      // Fetch the client details based on Mou_no and CustomerName
      const clientDetails = await AllClientsModel.findOne({
        Mou_no: Mou_no,
        CustomerName: CustomerName
      });
  
      if (!clientDetails) {
        return res.status(404).json({ success: false, message: 'Client not found' });
      }
  
      // If found, return the client details
      res.status(200).json({ success: true, clientDetails });
    } catch (error) {
      console.error('Error fetching client details:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };


  // Controller to update the medium of a specific client MOU
// Controller to update the medium of a specific client MOU only for the last batch
export const updateClientMedium = async (req, res) => {
  const { Mou_no } = req.params; // Updated param to match frontend
  const { medium } = req.body;

  try {
    // Find the DailyClients document containing the specified MOU
    const dailyClient = await DailyClientsModel.findOne({
      "cycles.batches.mous.mou": Mou_no
    });

    if (!dailyClient) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Get the current cycle (last cycle in the cycles array)
    const currentCycle = dailyClient.cycles[dailyClient.cycles.length - 1];

    // Get the last batch in the current cycle
    const lastBatch = currentCycle.batches[currentCycle.batches.length - 1];

    // Check if the MOU exists in the last batch
    const mouIndex = lastBatch.mous.findIndex(mou => mou.mou === Mou_no);

    if (mouIndex === -1) {
      return res.status(404).json({ message: "MOU not found in the last batch" });
    }

    // Update the medium of the MOU in the last batch
    lastBatch.mous[mouIndex].medium = medium;

    // Save the updated document
    await dailyClient.save();

    res.json({ success: true, client: dailyClient });
  } catch (error) {
    console.error("Error updating client medium:", error);
    res.status(500).json({ message: "Failed to update medium", error });
  }
};





// Fetch upcoming commitments specific to the logged-in CSS user
export const getUpcomingCommitments = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);

    // Authorization check to ensure the user is a CSS
    if (!user || user.role !== 'user' || user.designation !== 'CSS') {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    // Fetch clients assigned to this CSS user with "not done" commitments
    const clients = await AllClientsModel.find({
      CSS: user.name, // Only fetch clients assigned to this CSS user
      "Commitments.status": "not done",
    }).select("Mou_no CustomerName Commitments")
    .then((clients) => {
      // Filter commitments array to include only those with status "not done"
      return clients.map(client => ({
        ...client.toObject(),
        Commitments: client.Commitments.filter(comm => comm.status === "not done")
      }));
    });

    return res.status(200).json({ success: true, clients });
  } catch (error) {
    console.error('Error fetching clients with "not done" commitments:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


export const trackCommitmentDeadlines = (io) => {
  setInterval(async () => {
    const now = moment();

    try {
      const clients = await AllClientsModel.find();
      
      clients.forEach(client => {
        client.Commitments.forEach(commitment => {
          if (commitment.status === "not done") {
            const deadline = moment(commitment.deadline);
            const minutesUntilDeadline = deadline.diff(now, "minutes");

            // Emit reminders at 2 minutes and 1 minute before the deadline
            if (minutesUntilDeadline === 2 || minutesUntilDeadline === 1) {
              io.to(client.CSS).emit("commitmentReminder", {
                clientName: client.CustomerName,
                commitment: commitment.commitment,
                timeLeft: minutesUntilDeadline === 2 ? "2 minutes" : "1 minute",
              });
            }

            // Emit reminders at 1 minute and 2 minutes after the deadline if still not done
            if (minutesUntilDeadline === -1 || minutesUntilDeadline === -2) {
              io.to(client.CSS).emit("overdueCommitment", {
                clientName: client.CustomerName,
                commitment: commitment.commitment,
                overdueBy: Math.abs(minutesUntilDeadline) === 1 ? "1 minute" : "2 minutes",
              });
            }
          }
        });
      });
    } catch (error) {
      console.error("Error tracking commitments:", error);
    }
  }, 60000); // Run every minute
};

export { getClientsForCSS, getClientDetailsForCSS , generateBatch, getLastBatchForCSS, getAllCSSBatchInfo, getBatchesByDate , getClientDetailsByMouAndName};


