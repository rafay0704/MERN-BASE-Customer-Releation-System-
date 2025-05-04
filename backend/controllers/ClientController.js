import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import AllClientsModel from "../models/AllClients.js";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Resolve __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);




// Updated getClients function to fetch only necessary data for admin dashboard
const getClients = async (req, res) => {
  try {
    const result = await AllClientsModel.aggregate([
      {
        $facet: {
          // Aggregations for Active clients
          statusCounts: [
            { $match: { Stage: "Active" } }, // Only active clients
            { $group: { _id: "$Status", count: { $sum: 1 } } }
          ],
          flagCounts: [
            { $match: { Stage: "Active" } }, // Only active clients
            { $group: { _id: "$Flag", count: { $sum: 1 } } }
          ],
          totalActiveClients: [
            { $match: { Stage: "Active" } }, // Only active clients
            { $count: "count" }
          ],
          submittedEB: [
            { $match: { Stage: "Active" } }, // Only active clients
            { $unwind: "$SubmittedEB" },
            { $group: { _id: "$SubmittedEB.EB", count: { $sum: 1 } } }
          ],
          branchLocation: [
            { $match: { Stage: "Active" } }, // Only active clients
            { $group: { _id: "$BranchLocation", count: { $sum: 1 } } }
          ],
          cssDistribution: [
            { $match: { Stage: "Active" } }, // Only active clients
            { $group: { _id: "$CSS", count: { $sum: 1 } } }
          ],
          businessPlanRequired: [
            { $match: { Stage: "Active", Status: "Business Plan Required" } },
            { $group: { _id: "$Status", count: { $sum: 1 } } }
          ],
          submissionNeeded: [
            { $match: { Stage: "Active", Status: "Need To Submit Documents Received" } },
            { $group: { _id: "$Status", count: { $sum: 1 } } }
          ],
          submittedToEB: [
            { $match: { Stage: "Active", Status: "Endorsement Application Submitted" } },
            { $group: { _id: "$Status", count: { $sum: 1 } } }
          ],
          endorsementFailed: [
            { $match: { Stage: "Active", Status: "Endorsement Application Rejected" } },
            { $group: { _id: "$Status", count: { $sum: 1 } } }
          ],

          // Aggregation for Stage distribution (include all stages)
          stageDistribution: [
            { $group: { _id: "$Stage", count: { $sum: 1 } } } // No Stage filter, counts all stages
          ]
        }
      }
    ]);

    const data = result[0]; // Extract the results from the $facet output

    res.status(200).json({
      success: true,
      clientsStats: {
        activeClients: data.totalActiveClients.length > 0 ? data.totalActiveClients[0].count : 0,
        statusCounts: data.statusCounts,
        businessPlanRequired: data.businessPlanRequired.length > 0 ? data.businessPlanRequired[0].count : 0,
        submissionNeeded: data.submissionNeeded.length > 0 ? data.submissionNeeded[0].count : 0,
        submittedToEB: data.submittedToEB.length > 0 ? data.submittedToEB[0].count : 0,
        endorsementFailed: data.endorsementFailed.length > 0 ? data.endorsementFailed[0].count : 0,
        stageDistribution: data.stageDistribution, // Includes all stages
        submittedEB: data.submittedEB,
        branchLocation: data.branchLocation,
        cssDistribution: data.cssDistribution,
        flagCounts: data.flagCounts
      }
    });

  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



export const getClientStatuses = async (req, res) => {
  try {
    // Query to fetch only active clients
    const filterQuery = { Stage: "Active" };

    // Aggregation to fetch statuses and their counts
    const clientStatuses = await AllClientsModel.aggregate([
      {
        $match: filterQuery, // Filter by Stage
      },
      {
        $group: {
          _id: "$Status", // Group by Status
          count: { $sum: 1 }, // Count occurrences of each status
        },
      },
      {
        $sort: { count: -1 }, // Sort by count descending
      },
    ]);

    // Aggregation to get unique statuses per CSS along with their counts
    const uniqueStatusesPerCSS = await AllClientsModel.aggregate([
      { $match: filterQuery },
      {
        $group: {
          _id: "$CSS", // Group by CSS
          statuses: {
            $push: { status: "$Status", count: 1 }, // Collect all statuses with count 1 initially
          },
        },
      },
      {
        $unwind: "$statuses", // Unwind to count occurrences of each status per CSS
      },
      {
        $group: {
          _id: { css: "$_id", status: "$statuses.status" }, // Group by CSS and Status
          count: { $sum: 1 }, // Count occurrences of each status in the CSS
        },
      },
      {
        $group: {
          _id: "$_id.css", // Group by CSS again
          uniqueStatuses: {
            $push: { status: "$_id.status", count: "$count" },
          }, // Group statuses with their counts
        },
      },
    ]);

    // Calculate the total count of unique status values
    const uniqueStatusesCount = clientStatuses.length;

    // Respond with only the required data: statuses, counts, and unique statuses per CSS
    res.status(200).json({
      success: true,
      data: clientStatuses, // Grouped statuses with counts
      uniqueStatusesCount, // Count of unique statuses
      uniqueStatusesPerCSS, // Unique statuses per CSS with their counts
    });
  } catch (error) {
    console.error("Error fetching client statuses:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


// Common projection fields for both queries
const CLIENT_FIELDS = {
  Pinned: 1,
  Mou_no: 1,
  Flag: 1,
  CustomerName: 1,
  Date: 1,
  Phone: 1,
  Mobile: 1,
  Email: 1,
  LatestComments: 1,
  BranchLocation: 1,
  CSS: 1,
  Status: 1,
  Stage: 1,
  Language: 1,
  InvestmentFund: 1,
  Industry: 1,
};

// Controller to fetch clients with Stage set to "Active"
export const getActiveClients = async (req, res) => {
  try {
    // Use `.lean()` to fetch plain JavaScript objects (faster)
    const activeClients = await AllClientsModel.find({ Stage: "Active" }, CLIENT_FIELDS).lean();
    res.status(200).json({ success: true, clients: activeClients });
  } catch (error) {
    handleError(res, "Error fetching active clients", error);
  }
};

// Controller to fetch clients with Stage NOT set to "Active"
export const getNonActiveClients = async (req, res) => {
  try {
    // Use `.lean()` for better performance
    const nonActiveClients = await AllClientsModel.find(
      { $or: [{ Stage: { $ne: "Active" } }, { Stage: { $exists: false } }] },
      CLIENT_FIELDS
    ).lean();
    res.status(200).json({ success: true, clients: nonActiveClients });
  } catch (error) {
    handleError(res, "Error fetching non-active clients", error);
  }
};

// Common error handling function
const handleError = (res, message, error) => {
  console.error(message, error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
};





// // Controller to fetch clients with Stage set to "Active"

// export const getActiveClients = async (req, res) => {
//   try {
//     const activeClients = await AllClientsModel.find(
//       { Stage: "Active" },
//       { 
//         Pinned: 1,
//         Mou_no: 1,
//         Flag: 1,
//         CustomerName: 1,
//         Date: 1,
//         Phone: 1,
//         Mobile: 1,
//         Email: 1,
//         LatestComments: 1,
//         BranchLocation: 1,
//         CSS: 1,
//         Status: 1,
//         Stage: 1,
//         Language: 1,
//         InvestmentFund :1 ,
//         Industry : 1
//       }
//     );
//     res.status(200).json({ success: true, clients: activeClients });
//   } catch (error) {
//     console.error("Error fetching active clients:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

// // Controller to fetch clients with Stage NOT set to "Active"
// export const getNonActiveClients = async (req, res) => {
//   try {
//     const nonActiveClients = await AllClientsModel.find(
//       {
//         $or: [
//           { Stage: { $ne: "Active" } },
//           { Stage: { $exists: false } }
//         ]
//       },
//       { 
//         Pinned: 1,
//         Mou_no: 1,
//         Flag: 1,
//         CustomerName: 1,
//         Date: 1,
//         Phone: 1,
//         Mobile: 1,
//         Email: 1,
//         LatestComments: 1,
//         BranchLocation: 1,
//         CSS: 1,
//         Status: 1,
//         Stage: 1,
//         Language: 1,
//         InvestmentFund :1 ,
//         Industry : 1,
//       }
//     );
//     res.status(200).json({ success: true, clients: nonActiveClients });
//   } catch (error) {
//     console.error("Error fetching non-active clients:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };


// Controller to fetch clients grouped by year and stage


// Controller to fetch clients year-wise with stage count



export const getClientsByYearAndStage = async (req, res) => {
  try {
    // Aggregation pipeline to fetch data
    const result = await AllClientsModel.aggregate([
      {
        $addFields: {
          // Regex to check if Date is in the expected 'dd MMM yyyy' format
          isValidDate: { $regexMatch: { input: "$Date", regex: /^[0-9]{2} [A-Za-z]{3} [0-9]{4}$/ } },
        },
      },
      {
        $facet: {
          // Process valid dates
          validDates: [
            { $match: { isValidDate: true } },
            {
              $project: {
                year: { $substr: ["$Date", 7, 4] }, // Extract the year
                Stage: 1,
              },
            },
            {
              $match: {
                year: { $regex: /^[0-9]{4}$/ }, // Ensure the year is valid
              },
            },
            {
              $group: {
                _id: "$year",
                totalClients: { $sum: 1 },
                stages: { $push: "$Stage" },
              },
            },
            {
              $addFields: {
                stageCounts: {
                  $map: {
                    input: { $setUnion: ["$stages"] }, // Unique stages
                    as: "stage",
                    in: {
                      stage: "$$stage",
                      count: {
                        $size: {
                          $filter: {
                            input: "$stages",
                            as: "s",
                            cond: { $eq: ["$$s", "$$stage"] }, // Count occurrences
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
          // Collect invalid dates
          invalidDates: [
            { $match: { isValidDate: false } },
            { $project: { Mou_no: 1, Date: 1 } }, // Include MOU and invalid date
          ],
        },
      },
    ]);

    const validData = result[0]?.validDates || [];
    const invalidData = result[0]?.invalidDates || [];

    // Format the valid data
    const clientsByYear = validData.map(item => ({
      year: item._id,
      totalClients: item.totalClients,
      stageCounts: item.stageCounts,
    }));

    // Count and list invalid dates
    const invalidCount = invalidData.length;
    const invalidMouList = invalidData.map(item => ({ Mou_no: item.Mou_no, Date: item.Date }));

    res.status(200).json({
      success: true,
      data: {
        clientsByYear,
        invalidDateCount: invalidCount,
        invalidMouList,
      },
    });
  } catch (error) {
    console.error("Error fetching clients by year and stage:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



export const updateCommitmentStatus = async (req, res) => {
  const { Mou_no, commitmentId } = req.params; // Find client and commitment by IDs
  const { status } = req.body;

  try {
    const client = await AllClientsModel.findOne({ Mou_no });
    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    // Find the commitment within the client's commitments array
    const commitment = client.Commitments.id(commitmentId);
    if (!commitment) {
      return res.status(404).json({ message: 'Commitment not found.' });
    }

    // Only update the status and timestamp if the status is changing
    if (commitment.status !== status) {
      commitment.status = status;
      commitment.statusTimestamp = new Date(); // Set the new status timestamp
    }

    await client.save();

    res.status(200).json({ message: 'Commitment status updated successfully.', commitment });
  } catch (error) {
    console.error('Error updating commitment status:', error);
    res.status(500).json({ message: 'Failed to update commitment status.' });
  }
};


const updateCriticalHighlightStatus = async (req, res) => {
  try {
    const { id, highlightId } = req.params; // Get Mou_no and highlightId from URL parameters
    const { status } = req.body; // Get new status from request body

    // Validate the status
    if (!status || !['catered', 'not catered'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status. Must be 'catered' or 'not catered'" });
    }

    // Find the client and update the status of the specified critical highlight
    const updatedClient = await AllClientsModel.findOneAndUpdate(
      { Mou_no: id, 'CriticalHighlights._id': highlightId },
      { 
        $set: { 
          'CriticalHighlights.$.status': status,
          'CriticalHighlights.$.statusTimestamp': new Date() // Update status timestamp only if status changes
        }
      },
      { new: true }
    );

    if (!updatedClient) {
      return res.status(404).json({ success: false, message: "Client or Critical Highlight not found" });
    }

    res.status(200).json({ success: true, client: updatedClient });
  } catch (error) {
    console.error("Error updating critical highlight status:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getUncheckedCriticalHighlightsAndCommitments = async (req, res) => {
  try {
    // Fetch all clients with critical highlights or commitments matching the criteria
    const clients = await AllClientsModel.find({
      $or: [
        { CriticalHighlights: { $elemMatch: { AdminCheck: false, status: "catered" } } },
        { Commitments: { $elemMatch: { AdminCheck: false, status: "done" } } }
      ]
    }).select("Mou_no CustomerName CSS CriticalHighlights Commitments");

    // Format the results
    const results = clients.map(client => ({
      Mou_no: client.Mou_no,
      CustomerName: client.CustomerName,
      CSS: client.CSS,
      CriticalHighlights: client.CriticalHighlights.filter(
        highlight => !highlight.AdminCheck && highlight.status === "catered"
      ),
      Commitments: client.Commitments.filter(
        commitment => !commitment.AdminCheck && commitment.status === "done"
      )
    }));

    res.status(200).json({
      success: true,
      message: "Fetched unchecked critical highlights and commitments successfully",
      data: results
    });
  } catch (error) {
    console.error("Error fetching unchecked critical highlights and commitments:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};  



export const updateAdminCheck = async (req, res) => {
  try {
    const { Mou_no, commitmentId, highlightId } = req.params;

    // Update commitment AdminCheck to true and add timestamp
    if (commitmentId) {
      const updatedClient = await AllClientsModel.findOneAndUpdate(
        { Mou_no, 'Commitments._id': commitmentId },
        { 
          $set: { 
            'Commitments.$.AdminCheck': true,
            'Commitments.$.adminCheckTimestamp': new Date() // Set admin check timestamp only when set to true
          }
        },
        { new: true }
      );

      if (!updatedClient) {
        return res.status(404).json({ success: false, message: "Client or Commitment not found" });
      }

      return res.status(200).json({ success: true, message: 'Commitment AdminCheck updated successfully', client: updatedClient });
    }

    // Update critical highlight AdminCheck to true and add timestamp
    if (highlightId) {
      const updatedClient = await AllClientsModel.findOneAndUpdate(
        { Mou_no, 'CriticalHighlights._id': highlightId },
        { 
          $set: { 
            'CriticalHighlights.$.AdminCheck': true,
            'CriticalHighlights.$.adminCheckTimestamp': new Date() // Set admin check timestamp only when set to true
          }
        },
        { new: true }
      );

      if (!updatedClient) {
        return res.status(404).json({ success: false, message: "Client or Critical Highlight not found" });
      }

      return res.status(200).json({ success: true, message: 'Critical Highlight AdminCheck updated successfully', client: updatedClient });
    }

    res.status(400).json({ success: false, message: 'No commitment or highlight ID provided' });
  } catch (error) {
    console.error("Error updating AdminCheck:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


// Function to recursively read files from a directory
const getFilesRecursively = (directoryPath) => {
  let filesList = [];

  try {
    const files = fs.readdirSync(directoryPath);

    files.forEach((file) => {
      const fullPath = path.join(directoryPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Recursively read subfolder
        filesList = filesList.concat(getFilesRecursively(fullPath));
      } else {
        filesList.push(fullPath); // Add file to list
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${directoryPath}:`, error);
  }

  return filesList;
};


export const getClientDocuments = async (req, res) => {
  const clientId = req.params.id;
  
  try {
    const client = await AllClientsModel.findOne({ Mou_no: clientId });
    if (!client || !client.DocumentFolder) {
      return res.status(404).json({ message: 'Client document folder not found.' });
    }

    const clientDocumentFolder = path.join(process.env.DOCUMENT_PATH, client.CSS, client.BranchLocation, `${client.Mou_no}_${client.CustomerName}`);

    const getFoldersAndFiles = (directoryPath) => {
      const folderContents = {};
      try {
        const files = fs.readdirSync(directoryPath);  // Wrap this call in try-catch
        files.forEach((file) => {
          const fullPath = path.join(directoryPath, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            folderContents[file] = getFoldersAndFiles(fullPath);  // Store subfolder contents recursively
          } else {
            if (!folderContents['files']) folderContents['files'] = [];
            folderContents['files'].push(fullPath.replace(process.env.DOCUMENT_PATH, '').replace(/\\/g, '/'));
          }
        });
      } catch (error) {
        console.error("Error reading folder contents:", error);
      }
      return folderContents;
    };
    

    const documentStructure = getFoldersAndFiles(clientDocumentFolder);
    res.json({ folders: documentStructure });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Error retrieving documents.' });
  }
};


// Convert Excel serial dates to JavaScript Dates and format as "d MMM yyyy"
const excelDateToJSDate = (serial) => {
  if (!serial) return null; // Handle null or undefined values

  // Convert Excel serial date to JavaScript Date
  const unixEpoch = new Date(1899, 11, 30).getTime();
  const millisecondsPerDay = 86400000;
  const jsDate = new Date(unixEpoch + serial * millisecondsPerDay);

  // Format date as "d MMM yyyy"
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return jsDate.toLocaleDateString('en-GB', options); // 'en-GB' for "d MMM yyyy" format
};
// After Upload with CSS EMPTY NOT ACCEPT
const uploadExcel = async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer);
    const subfolders = [
      "Questionaire",
      "Business Plan",
      "Bank Statements",
      "Review Documents",
      "EB Refusal & Appeal",
      "EB Endorsement Letter",
      "Home Office Queries",
      "Background Profile",
      "Supporting Documents",
      "Residential Proof",
      "Identification Proof"
    ];

    const nonDuplicateClients = [];
    const existingClients = await AllClientsModel.find().select('CustomerName SalesAdvisor BranchLocation Mou_no');

    // Create a map for efficient duplicate checking
    const existingClientKeys = new Set(
      existingClients.map(client =>
        `${client.CustomerName.trim().toLowerCase()}|${client.SalesAdvisor.trim().toLowerCase()}|${client.BranchLocation.trim().toLowerCase()}`
      )
    );

    const existingMouSet = new Set(
      existingClients.map(client => client.Mou_no?.trim() || "")
    );

    const createFolderStructure = (baseFolderPath, clientFolderName, subfolders) => {
      try {
        const clientFolderPath = path.join(baseFolderPath, clientFolderName);

        if (!fs.existsSync(clientFolderPath)) {
          fs.mkdirSync(clientFolderPath, { recursive: true });
        }

        const submissionFolderPath = path.join(clientFolderPath, "Submission 1");
        if (!fs.existsSync(submissionFolderPath)) {
          fs.mkdirSync(submissionFolderPath, { recursive: true });
        }

        subfolders.forEach(subfolder => {
          const subfolderPath = path.join(submissionFolderPath, `${subfolder} 1`);
          if (!fs.existsSync(subfolderPath)) {
            fs.mkdirSync(subfolderPath, { recursive: true });
          }
        });

        return clientFolderPath;
      } catch (folderError) {
        throw new Error(`Error creating folder structure: ${folderError.message}`);
      }
    };

    // Loop through all sheets in the workbook
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const clients = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

      for (let client of clients) {
        // Check for empty CSS value
        if (!client.CSS || client.CSS.trim() === "") {
          return res.status(400).json({
            success: false,
            message: "CSS value must be provided for all rows before proceeding."
          });
        }

        // Generate unique key for duplicate checking
        const uniqueKey = `${client.CustomerName?.trim().toLowerCase()}|${client.SalesAdvisor?.trim().toLowerCase()}|${client.BranchLocation?.trim().toLowerCase()}`;

        if (existingClientKeys.has(uniqueKey)) {
          console.log(`Skipping duplicate client: ${client.CustomerName}`);
          continue;
        }

        // Handle empty MOU numbers
        if (!client.Mou_no || client.Mou_no.trim() === "") {
          client.Mou_no = "MOU_NOT_FOUND";
        }

        let originalMou_no = client.Mou_no;
        let counter = 1;

        // Ensure MOU number is unique
        while (existingMouSet.has(client.Mou_no.trim())) {
          client.Mou_no = `${originalMou_no}_(${counter})`;
          counter++;
        }

        // Update sets after uniqueness
        existingClientKeys.add(uniqueKey);
        existingMouSet.add(client.Mou_no.trim());

        // Prepare folder paths
        const baseFolderPath = path.join(process.env.DOCUMENT_PATH, client.CSS || "DefaultCSS");
        const branchFolderPath = path.join(baseFolderPath, client.BranchLocation || "DefaultBranch");
        const clientFolderName = `${client.Mou_no}_${client.CustomerName}`;

        try {
          const clientFolderPath = createFolderStructure(branchFolderPath, clientFolderName, subfolders);
          console.log(`Folder structure created for ${client.CustomerName}`);

          // Add document folder path
          client.DocumentFolder = clientFolderPath;

          // Set initial CSS value and its timestamp
          client.oldCSS = {
            CSS: client.CSS,
            Date: new Date()
          };

          // Add to non-duplicate list
          nonDuplicateClients.push(client);
        } catch (folderError) {
          console.error(`Error creating folders for ${client.CustomerName}:`, folderError);
        }
      }
    }

    // Insert non-duplicate clients into the database
    if (nonDuplicateClients.length > 0) {
      await AllClientsModel.insertMany(nonDuplicateClients);
      res.status(200).json({
        success: true,
        message: "Clients uploaded successfully",
        insertedCount: nonDuplicateClients.length
      });
    } else {
      res.status(200).json({
        success: true,
        message: "No new clients to upload"
      });
    }
  } catch (error) {
    console.error("Error processing Excel file:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};



// After Upload

// const uploadExcel = async (req, res) => {
//   try {
//     const workbook = xlsx.read(req.file.buffer);
//     const subfolders = [
//       "Questionaire",
//       "Business Plan",
//       "Bank Statements",
//       "Review Documents",
//       "EB Refusal & Appeal",
//       "EB Endorsement Letter",
//       "Home Office Queries",
//       "Background Profile",
//       "Supporting Documents",
//       "Residential Proof",
//       "Identification Proof"
//     ];

//     const nonDuplicateClients = [];
//     const existingClients = await AllClientsModel.find().select('CustomerName SalesAdvisor BranchLocation Mou_no');

//     // Create a map for efficient duplicate checking
//     const existingClientKeys = new Set(
//       existingClients.map(client =>
//         `${client.CustomerName.trim().toLowerCase()}|${client.SalesAdvisor.trim().toLowerCase()}|${client.BranchLocation.trim().toLowerCase()}`
//       )
//     );

//     const existingMouSet = new Set(
//       existingClients.map(client => client.Mou_no?.trim() || "")
//     );

//     const createFolderStructure = (baseFolderPath, clientFolderName, subfolders) => {
//       try {
//         const clientFolderPath = path.join(baseFolderPath, clientFolderName);

//         if (!fs.existsSync(clientFolderPath)) {
//           fs.mkdirSync(clientFolderPath, { recursive: true });
//         }

//         const submissionFolderPath = path.join(clientFolderPath, "Submission 1");
//         if (!fs.existsSync(submissionFolderPath)) {
//           fs.mkdirSync(submissionFolderPath, { recursive: true });
//         }

//         subfolders.forEach(subfolder => {
//           const subfolderPath = path.join(submissionFolderPath, `${subfolder} 1`);
//           if (!fs.existsSync(subfolderPath)) {
//             fs.mkdirSync(subfolderPath, { recursive: true });
//           }
//         });

//         return clientFolderPath;
//       } catch (folderError) {
//         throw new Error(`Error creating folder structure: ${folderError.message}`);
//       }
//     };

//     for (const sheetName of workbook.SheetNames) {
//       const worksheet = workbook.Sheets[sheetName];
//       const clients = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

//       for (let client of clients) {
//         // Generate unique key for duplicate checking
//         const uniqueKey = `${client.CustomerName?.trim().toLowerCase()}|${client.SalesAdvisor?.trim().toLowerCase()}|${client.BranchLocation?.trim().toLowerCase()}`;

//         if (existingClientKeys.has(uniqueKey)) {
//           console.log(`Skipping duplicate client: ${client.CustomerName}`);
//           continue;
//         }

//         // Handle empty MOU numbers
//         if (!client.Mou_no || client.Mou_no.trim() === "") {
//           client.Mou_no = "MOU_NOT_FOUND";
//         }

//         let originalMou_no = client.Mou_no;
//         let counter = 1;

//         // Ensure MOU number is unique
//         while (existingMouSet.has(client.Mou_no.trim())) {
//           client.Mou_no = `${originalMou_no}_(${counter})`;
//           counter++;
//         }

//         // Update sets after uniqueness
//         existingClientKeys.add(uniqueKey);
//         existingMouSet.add(client.Mou_no.trim());

//         // Prepare folder paths
//         const baseFolderPath = path.join(process.env.DOCUMENT_PATH, client.CSS || "DefaultCSS");
//         const branchFolderPath = path.join(baseFolderPath, client.BranchLocation || "DefaultBranch");
//         const clientFolderName = `${client.Mou_no}_${client.CustomerName}`;

//         try {
//           const clientFolderPath = createFolderStructure(branchFolderPath, clientFolderName, subfolders);
//           console.log(`Folder structure created for ${client.CustomerName}`);

//           // Add document folder path
//           client.DocumentFolder = clientFolderPath;

//           // Add to non-duplicate list
//           nonDuplicateClients.push(client);
//         } catch (folderError) {
//           console.error(`Error creating folders for ${client.CustomerName}:`, folderError);
//         }
//       }
//     }

//     // Insert non-duplicate clients into the database
//     if (nonDuplicateClients.length > 0) {
//       await AllClientsModel.insertMany(nonDuplicateClients);
//       res.status(200).json({
//         success: true,
//         message: "Clients uploaded successfully",
//         insertedCount: nonDuplicateClients.length
//       });
//     } else {
//       res.status(200).json({
//         success: true,
//         message: "No new clients to upload"
//       });
//     }
//   } catch (error) {
//     console.error("Error processing Excel file:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error"
//     });
//   }
// };


// Initial UPload Controller 

// const uploadExcel = async (req, res) => {
//   try {
//     const workbook = xlsx.read(req.file.buffer);
//     const subfolders = [
//       "Questionaire",
//       "Business Plan",
//       "Bank Statements",
//       "Review Documents",
//       "EB Refusal & Appeal",
//       "EB Endorsement Letter",
//       "Home Office Queries",
//       "Background Profile",
//       "Supporting Documents",
//       "Residential Proof",
//       "Identification Proof"
//     ];

//     const nonDuplicateClients = [];

//     // Fetch existing MOU numbers to avoid duplicates
//     const existingMouNumbers = await AllClientsModel.find().select('Mou_no');
//     const existingMouSet = new Set(existingMouNumbers.map(client => client.Mou_no.trim()));

//     for (const sheetName of workbook.SheetNames) {
//       const worksheet = workbook.Sheets[sheetName];
//       const clients = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

//       for (let client of clients) {
//         // Handle empty MOU numbers
//         if (!client.Mou_no || client.Mou_no.trim() === "") {
//           console.log(`Empty Mou_no found for CustomerName: ${client.CustomerName}, setting Mou_no to MOU_NOT_FOUND`);
//           client.Mou_no = "MOU_NOT_FOUND";
//         }

//         if (client.Date && !isNaN(client.Date)) {
//           client.Date = excelDateToJSDate(client.Date);
//         }

//         let originalMou_no = client.Mou_no;
//         let counter = 1;

//         // Ensure MOU number is unique
//         while (existingMouSet.has(client.Mou_no.trim())) {
//           console.log(`Duplicate found for Mou_no: ${client.Mou_no}, CustomerName: ${client.CustomerName}. Generating new Mou_no: ${originalMou_no} / ${counter}`);
//           client.Mou_no = `${originalMou_no}_(${counter})`;
//           counter++;
//         }

//         // Finalize the unique MOU number
//         console.log(`Final MOU number for CustomerName: ${client.CustomerName}: ${client.Mou_no}`);

//         // Remove sanitize functionality (skip sanitizing MOU and CustomerName)

//         const baseFolderPath = path.join(process.env.DOCUMENT_PATH, client.CSS || "DefaultCSS");
//         const branchFolderPath = path.join(baseFolderPath, client.BranchLocation || "DefaultBranch");

//         // Create folder: "MOU_CustomerName"
//         const clientFolderName = `${client.Mou_no}_${client.CustomerName}`;
//         const clientFolderPath = path.join(branchFolderPath, clientFolderName);

//         try {
//           if (!fs.existsSync(clientFolderPath)) {
//             fs.mkdirSync(clientFolderPath, { recursive: true });
//           }

//           // Create "Submission 1" folder
//           const submissionFolderPath = path.join(clientFolderPath, "Submission 1");
//           if (!fs.existsSync(submissionFolderPath)) {
//             fs.mkdirSync(submissionFolderPath, { recursive: true });
//           }

//           // Create subfolders under "Submission 1"
//           subfolders.forEach(subfolder => {
//             const subfolderPath = path.join(submissionFolderPath, `${subfolder} 1`);
//             if (!fs.existsSync(subfolderPath)) {
//               fs.mkdirSync(subfolderPath, { recursive: true });
//             }
//           });

//           console.log(`Folder structure created successfully for ${client.CustomerName}: ${clientFolderPath}`);

//           // Add to non-duplicate list
//           client.DocumentFolder = clientFolderPath;
//           nonDuplicateClients.push(client);

//           // Add new MOU number to the set
//           existingMouSet.add(client.Mou_no.trim());
//         } catch (folderError) {
//           console.error(`Error creating folder structure for ${client.CustomerName} with MOU: ${client.Mou_no}`, folderError);
//         }
//       }
//     }

//     // Insert clients into database
//     if (nonDuplicateClients.length > 0) {
//       await AllClientsModel.insertMany(nonDuplicateClients);
//       res.status(200).json({
//         success: true,
//         message: "Clients uploaded successfully",
//         insertedCount: nonDuplicateClients.length
//       });
//     } else {
//       res.status(200).json({
//         success: true,
//         message: "No new clients to upload"
//       });
//     }
//   } catch (error) {
//     console.error("Error processing Excel file:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error"
//     });
//   }
// };

export const exportDataToExcel = async (req, res) => {
  try {
    const allClients = await AllClientsModel.find().lean(); // Fetch all data from the database
    
    const workbook = xlsx.utils.book_new(); // Create a new workbook
    const worksheet = xlsx.utils.json_to_sheet(allClients); // Convert data to a worksheet
    xlsx.utils.book_append_sheet(workbook, worksheet, "AllClients"); // Add the sheet to the workbook

    // Write the workbook to a buffer
    const excelBuffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Set response headers for download
    res.setHeader("Content-Disposition", "attachment; filename=AllClients.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    res.send(excelBuffer); // Send the buffer to the client
  } catch (error) {
    console.error("Error exporting data to Excel:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const uploadAndRecoverExcel = async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer); // Read uploaded Excel file
    const sheetName = workbook.SheetNames[0]; // Assuming the first sheet contains data
    const worksheet = workbook.Sheets[sheetName];
    const clients = xlsx.utils.sheet_to_json(worksheet, { defval: "" }); // Convert sheet to JSON

    const bulkOps = clients.map(client => {
      return {
        updateOne: {
          filter: { Mou_no: client.Mou_no }, // Match by unique MOU number
          update: { $set: client }, // Update existing record
          upsert: true, // Insert if not found
        },
      };
    });

    // Perform bulk write operation
    const result = await AllClientsModel.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: "Data uploaded and recovered successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
    });
  } catch (error) {
    console.error("Error uploading and recovering data:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export default uploadAndRecoverExcel;



// const uploadExcel = async (req, res) => {
//   try {
//     const workbook = xlsx.read(req.file.buffer);
//     const subfolders = [
//       "Questionaire",
//       "Business Plan",
//       "Bank Statements",
//       "Review Documents",
//       "EB Refusal & Appeal",
//       "EB Endorsement Letter",
//       "Home Office Queries",
//       "Background Profile",
//       "Supporting Documents",
//       "Residential Proof",
//       "Identification Proof"
//     ];

//     const nonDuplicateClients = [];

//     for (const sheetName of workbook.SheetNames) {
//       const worksheet = workbook.Sheets[sheetName];
//       const clients = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

//       for (let client of clients) {
//         if (client.Date && !isNaN(client.Date)) {
//           client.Date = excelDateToJSDate(client.Date);
//         }

//         const existingClient = await AllClientsModel.findOne({
//           Mou_no: client.Mou_no,
//           CustomerName: client.CustomerName,
//           Nationality: client.Nationality,
//           Email: client.Email,
//         });

//         if (!existingClient) {
//           client.oldCSS = { CSS: client.CSS, Date: new Date() };

//           const baseFolderPath = path.join(process.env.DOCUMENT_PATH, client.CSS);
//           const branchFolderPath = path.join(baseFolderPath, client.BranchLocation);
//           const clientFolderName = `${client.Mou_no}_${client.CustomerName}`;
//           const clientFolderPath = path.join(branchFolderPath, clientFolderName);

//           if (!fs.existsSync(clientFolderPath)) {
//             fs.mkdirSync(clientFolderPath, { recursive: true });
//           }

//           // Create "Submission 1" folder
//           const submissionFolderPath = path.join(clientFolderPath, `Submission 1`);
//           if (!fs.existsSync(submissionFolderPath)) {
//             fs.mkdirSync(submissionFolderPath, { recursive: true });
//           }

//           // Create subfolders within "Submission 1" with suffix "1"
//           subfolders.forEach((subfolder) => {
//             const subfolderPath = path.join(submissionFolderPath, `${subfolder} 1`);
//             if (!fs.existsSync(subfolderPath)) {
//               fs.mkdirSync(subfolderPath, { recursive: true });
//             }
//           });

//           client.DocumentFolder = clientFolderPath;
//           nonDuplicateClients.push(client);
//         } else {
//           console.log(`Duplicate found for Mou_no: ${client.Mou_no}, CustomerName: ${client.CustomerName}`);
//         }
//       }
//     }

//     if (nonDuplicateClients.length > 0) {
//       await AllClientsModel.insertMany(nonDuplicateClients);
//       res.status(200).json({ success: true, message: "Clients uploaded successfully", insertedCount: nonDuplicateClients.length });
//     } else {
//       res.status(200).json({ success: true, message: "No new clients to upload" });
//     }
//   } catch (error) {
//     console.error("Error processing Excel file:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

// Get details of a single client by Mou_no
const getClientDetails = async (req, res) => {
  const { id } = req.params;

  try {
    // Use lean() to get plain JavaScript objects, improving performance
    const client = await AllClientsModel.findOne({ Mou_no: id }).lean();

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found"
      });
    }

    return res.status(200).json({
      success: true,
      client
    });
  } catch (error) {
    // Log error for debugging purposes
    console.error("Error fetching client details:", error);

    // Handle different error cases (e.g., database issues)
    const message = error instanceof Error ? error.message : "Internal Server Error";

    return res.status(500).json({
      success: false,
      message
    });
  }
};

// const getClientDetails = async (req, res) => {
//   try {
//     const { mou, customerName } = req.query; // Assume we get Mou_no and CustomerName via query parameters.

//     if (!mou || !customerName) {
//       return res.status(400).json({
//         success: false,
//         message: "Mou_no and CustomerName are required.",
//       });
//     }

//     // Search for a client with matching Mou_no and CustomerName.
//     const client = await AllClientsModel.findOne({
//       Mou_no: mou,
//       CustomerName: customerName,
//     });

//     if (!client) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Client not found with given details." });
//     }

//     res.status(200).json({ success: true, client });
//   } catch (error) {
//     console.error("Error fetching client details:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };


// const updateClientDetails = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     // Find the existing client data
//     const existingClient = await AllClientsModel.findOne({ Mou_no: id });

//     if (!existingClient) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Client not found" });
//     }

     
// // Track changes to the Stage field
// if (updateData.Stage && updateData.Stage !== existingClient.Stage) {
//   const stageChange = {
//     newStage: updateData.Stage,
//     updatedAt: new Date(),
//   };

//   updateData.StageHistory = existingClient.StageHistory || [];
//   updateData.StageHistory.push(stageChange);
// }

    
//     // Update flag if a new color is provided
//     if (updateData.Flag) {
//       existingClient.Flag = updateData.Flag;
//     }


//        // Proceed with updating the client data
//        if (updateData.Date) {
//         existingClient.Date = updateData.Date;  // Update Date field
//       }
//   // Check if the Status is being updated to "Endorsed"
 
//     // Check if the checklist has been modified
//     if (updateData.Checklist) {
//       Object.keys(updateData.Checklist).forEach(item => {
//         // Only update timestamp if the value has changed
//         if (
//           updateData.Checklist[item].value !== existingClient.Checklist[item].value
//         ) {
//           updateData.Checklist[item].timestamp = new Date();
//         }
//       });


   

//       // Ensure ChecklistCompleted is updated automatically based on other fields
//       const allChecklistItemsTrue = Object.keys(existingClient.Checklist).every(item => {
//         if (item !== "ChecklistCompleted") {
//           return existingClient.Checklist[item].value === true || 
//                  updateData.Checklist[item]?.value === true;
//         }
//         return true;
//       });

//       // Set ChecklistCompleted to true only if all other items are true
//       if (allChecklistItemsTrue) {
//         updateData.Checklist.ChecklistCompleted = {
//           value: true,
//           timestamp: new Date()
//         };
        
//         // Update the status to "Submission Needed"
//         updateData.Status = "Need To Submit Documents Received";
//       } else {
//         updateData.Checklist.ChecklistCompleted = {
//           value: false,
//           timestamp: existingClient.Checklist.ChecklistCompleted.timestamp
//         };
//       }
//     }

//     // Perform the update
//     const updatedClient = await AllClientsModel.findOneAndUpdate(
//       { Mou_no: id },
//       updateData,
//       { new: true }
//     );

//     if (!updatedClient) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Client not found after update" });
//     }

//     res.status(200).json({ success: true, client: updatedClient });
//   } catch (error) {
//     console.error("Error updating client details:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

const updateClientDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Fetch and validate existing client data in one step
    const existingClient = await AllClientsModel.findOne({ Mou_no: id });
    if (!existingClient) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    // Handle Stage changes
    if (updateData.Stage && updateData.Stage !== existingClient.Stage) {
      updateData.StageHistory = existingClient.StageHistory || [];
      updateData.StageHistory.push({
        newStage: updateData.Stage,
        updatedAt: new Date(),
      });
    }

    // Update Flag if provided
    if (updateData.Flag) {
      existingClient.Flag = updateData.Flag;
    }

    // Update Date if provided
    if (updateData.Date) {
      existingClient.Date = updateData.Date;
    }

    // Handle Checklist updates
    if (updateData.Checklist) {
      const checklistKeys = Object.keys(updateData.Checklist);

      checklistKeys.forEach(item => {
        if (
          updateData.Checklist[item].value !== existingClient.Checklist?.[item]?.value
        ) {
          updateData.Checklist[item].timestamp = new Date();
        }
      });

      // Determine if ChecklistCompleted should be updated
      const allChecklistItemsTrue = checklistKeys.every(item => {
        return (
          item === "ChecklistCompleted" ||
          updateData.Checklist[item]?.value === true ||
          existingClient.Checklist?.[item]?.value === true
        );
      });

      updateData.Checklist.ChecklistCompleted = {
        value: allChecklistItemsTrue,
        timestamp: allChecklistItemsTrue ? new Date() : existingClient.Checklist?.ChecklistCompleted?.timestamp,
      };

      // Automatically update Status if ChecklistCompleted is true
      if (allChecklistItemsTrue) {
        updateData.Status = "Need To Submit Documents Received";
      }
    }

    // Perform the update
    const updatedClient = await AllClientsModel.findOneAndUpdate(
      { Mou_no: id },
      updateData,
      { new: true }
    );

    if (!updatedClient) {
      return res.status(404).json({ success: false, message: "Client not found after update" });
    }

    res.status(200).json({ success: true, client: updatedClient });
  } catch (error) {
    console.error("Error updating client details:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// In ClientController.js
const addComment = async (req, res) => {
  try {
    const { id } = req.params; // Get Mou_no from URL parameters
    const { comment } = req.body; // Get comment from request body
    const name = req.user.name; // Get user name from the request object

    // Validate the request
    if (!comment || !name) {
      return res
        .status(400)
        .json({ success: false, message: "Comment is required" });
    }

    // Find the client and update the LatestComments array
    const updatedClient = await AllClientsModel.findOneAndUpdate(
      { Mou_no: id },
      { $push: { LatestComments: { comment, name, timestamp: new Date() } } },
      { new: true }
    );

    if (!updatedClient) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    res.status(200).json({ success: true, client: updatedClient });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Add Critical Highlight
const addCriticalHighlight = async (req, res) => {
  try {
    const { id } = req.params; // Get Mou_no from URL parameters
    const { criticalHighlight, expiryDate } = req.body; // Get highlight and expiry date from request body

    // Validate the request
    if (!criticalHighlight || !expiryDate) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Critical Highlight and expiry date are required",
        });
    }

    // Find the client and update the CriticalHighlights array
    const updatedClient = await AllClientsModel.findOneAndUpdate(
      { Mou_no: id },
      { $push: { CriticalHighlights: { criticalHighlight, expiryDate } } },
      { new: true }
    );

    if (!updatedClient) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    res.status(200).json({ success: true, client: updatedClient });
  } catch (error) {
    console.error("Error adding critical highlight:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Add a new entry to SubmittedEB
// Add a new entry to SubmittedEB
const addSubmittedEB = async (req, res) => {
  try {
    const { id } = req.params; // Get Mou_no from URL parameters
    const { EB, Result, Date } = req.body; // Get details from request body

    // Validate the request
    if (!EB || !Result || !Date) {
      return res
        .status(400)
        .json({ success: false, message: "EB, Result, and Date are required" });
    }

    // Find the client and update the SubmittedEB array
    const updatedClient = await AllClientsModel.findOneAndUpdate(
      { Mou_no: id },
      { $push: { SubmittedEB: { EB, Result, Date } } },
      { new: true }
    );

    if (!updatedClient) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

  
    res.status(200).json({ success: true, client: updatedClient });
  } catch (error) {
    console.error("Error adding submitted EB:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const shiftCSS = async (req, res) => {
  try {
    const { mouNos, cssUser } = req.body;

    if (!Array.isArray(mouNos)) {
      return res.status(400).json({ success: false, message: 'Invalid data format for mouNos' });
    }

    if (!cssUser) {
      return res.status(400).json({ success: false, message: 'CSS User is required' });
    }

    // Ensure the new CSS folder exists
    const baseFolderPath = path.join(process.env.DOCUMENT_PATH, cssUser);
    if (!fs.existsSync(baseFolderPath)) {
      fs.mkdirSync(baseFolderPath, { recursive: true });
    }

    // Process each client
    for (const mouNo of mouNos) {
      const client = await AllClientsModel.findOne({ Mou_no: mouNo });

      if (!client) {
        return res.status(404).json({ success: false, message: `Client with Mou_no ${mouNo} not found` });
      }

      const oldCSS = client.CSS;
      const oldFolderPath = path.join(process.env.DOCUMENT_PATH, oldCSS, client.BranchLocation, `${client.Mou_no}_${client.CustomerName}`);
      const newFolderPath = path.join(process.env.DOCUMENT_PATH, cssUser, client.BranchLocation, `${client.Mou_no}_${client.CustomerName}`);

      // Check if the client folder exists under the old CSS
      if (fs.existsSync(oldFolderPath)) {
        // Create the target folder structure if it doesn't exist
        if (!fs.existsSync(newFolderPath)) {
          fs.mkdirSync(newFolderPath, { recursive: true });
        }

        // Move the folder and its contents
        const files = fs.readdirSync(oldFolderPath);
        files.forEach((file) => {
          const oldFilePath = path.join(oldFolderPath, file);
          const newFilePath = path.join(newFolderPath, file);

          // Check if the file exists before renaming
          if (fs.existsSync(oldFilePath)) {
            try {
              fs.renameSync(oldFilePath, newFilePath);
            } catch (error) {
              console.error(`Error moving file ${file}:`, error);
            }
          } else {
            console.warn(`File ${file} does not exist at ${oldFilePath}`);
          }
        });

        // Remove the old directory if empty
        try {
          fs.rmdirSync(oldFolderPath, { recursive: true });
        } catch (error) {
          console.error(`Error removing directory ${oldFolderPath}:`, error);
        }
      } else {
        console.warn(`Old folder path does not exist: ${oldFolderPath}`);
      }

      // Update the CSS and the folder path in the database
      await AllClientsModel.updateOne(
        { Mou_no: mouNo },
        {
          $set: { CSS: cssUser, DocumentFolder: newFolderPath },
          $push: {
            ShiftCSS: {
              NewCSS: cssUser,
              Date: new Date(),
            },
          },
        }
      );
    }

    res.status(200).json({ success: true, message: 'CSS shift completed successfully' });
  } catch (error) {
    console.error('Error shifting CSS:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


// Edit a specific LatestComment
const editLatestComment = async (req, res) => {
  try {
    const { id, commentId } = req.params; // Get Mou_no and comment ID from URL parameters
    const { comment } = req.body; // Get new comment text from request body
    const editorName = req.user.name; // Get admin name from the request object

    // Validate the request
    if (!comment) {
      return res
        .status(400)
        .json({ success: false, message: "Comment is required" });
    }

    // Find the client and update the specific comment
    const updatedClient = await AllClientsModel.findOneAndUpdate(
      { Mou_no: id, "LatestComments._id": commentId },
      {
        $set: {
          "LatestComments.$.comment": comment,
          "LatestComments.$.timestamp": new Date(),
          "LatestComments.$.name": editorName,
        },
      },
      { new: true }
    );

    if (!updatedClient) {
      return res
        .status(404)
        .json({ success: false, message: "Client or comment not found" });
    }

    res.status(200).json({ success: true, client: updatedClient });
  } catch (error) {
    console.error("Error editing comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete a specific LatestComment
const deleteLatestComment = async (req, res) => {
  try {
    const { id, commentId } = req.params; // Get Mou_no and comment ID from URL parameters

    // Find the client and remove the specific comment
    const updatedClient = await AllClientsModel.findOneAndUpdate(
      { Mou_no: id },
      { $pull: { LatestComments: { _id: commentId } } },
      { new: true }
    );

    if (!updatedClient) {
      return res
        .status(404)
        .json({ success: false, message: "Client or comment not found" });
    }

    res.status(200).json({ success: true, client: updatedClient });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



const editSubmittedEB = async (req, res) => {
  try {
    const { id, ebId } = req.params; // Get Mou_no and EB ID from URL parameters
    const { EB, Result, Date } = req.body; // Get the updated EB details from request body

    // Validate the request
    if (!EB || !Result || !Date) {
      return res
        .status(400)
        .json({ success: false, message: "EB, Result, and Date are required" });
    }

    // Find the client and update the specific EB entry
    const updatedClient = await AllClientsModel.findOneAndUpdate(
      { Mou_no: id, "SubmittedEB._id": ebId },
      {
        $set: {
          "SubmittedEB.$.EB": EB,
          "SubmittedEB.$.Result": Result,
          "SubmittedEB.$.Date": Date,
        },
      },
      { new: true }
    );

    if (!updatedClient) {
      return res
        .status(404)
        .json({ success: false, message: "Client or EB entry not found" });
    }

   

    res.status(200).json({ success: true, client: updatedClient });
  } catch (error) {
    console.error("Error editing Submitted EB:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


  const deleteSubmittedEB = async (req, res) => {
    try {
      const { id, ebId } = req.params; // Get Mou_no and EB ID from URL parameters
  
      // Find the client and remove the specific EB entry
      const updatedClient = await AllClientsModel.findOneAndUpdate(
        { Mou_no: id },
        { $pull: { SubmittedEB: { _id: ebId } } },
        { new: true }
      );
  
      if (!updatedClient) {
        return res
          .status(404)
          .json({ success: false, message: "Client or EB entry not found" });
      }
  
      res.status(200).json({ success: true, client: updatedClient });
    } catch (error) {
      console.error("Error deleting Submitted EB:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
  const editCriticalHighlight = async (req, res) => {
    try {
      const { id, highlightId } = req.params; // Get Mou_no and Highlight ID from URL parameters
      const { criticalHighlight, expiryDate } = req.body; // Get the updated highlight details
  
      // Validate the request
      if (!criticalHighlight || !expiryDate) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Critical Highlight and expiry date are required",
          });
      }
  
      // Find the client and update the specific highlight entry
      const updatedClient = await AllClientsModel.findOneAndUpdate(
        { Mou_no: id, "CriticalHighlights._id": highlightId },
        {
          $set: {
            "CriticalHighlights.$.criticalHighlight": criticalHighlight,
            "CriticalHighlights.$.expiryDate": expiryDate,
          },
        },
        { new: true }
      );
  
      if (!updatedClient) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Client or Critical Highlight not found",
          });
      }
  
      res.status(200).json({ success: true, client: updatedClient });
    } catch (error) {
      console.error("Error editing Critical Highlight:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
  const deleteCriticalHighlight = async (req, res) => {
    try {
      const { id, highlightId } = req.params; // Get Mou_no and Highlight ID from URL parameters
  
      // Find the client and remove the specific highlight entry
      const updatedClient = await AllClientsModel.findOneAndUpdate(
        { Mou_no: id },
        { $pull: { CriticalHighlights: { _id: highlightId } } },
        { new: true }
      );
  
      if (!updatedClient) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Client or Critical Highlight not found",
          });
      }
  
      res.status(200).json({ success: true, client: updatedClient });
    } catch (error) {
      console.error("Error deleting Critical Highlight:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
 // Function to generate a unique filename if there's a conflict
 const generateUniqueFileName = (destinationPath) => {
  let baseName = path.basename(destinationPath, path.extname(destinationPath));
  let ext = path.extname(destinationPath);
  let newDestinationPath = destinationPath;
  let count = 1;

  while (fs.existsSync(newDestinationPath)) {
    newDestinationPath = path.join(path.dirname(destinationPath), `${baseName}(${count})${ext}`);
    count++;
  }

  return newDestinationPath;
};
 // Helper function to generate a unique name by appending (1), (2), etc.
const generateUniqueName = async (dirPath, originalName) => {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  let uniqueName = originalName;
  let counter = 1;

  while (fs.existsSync(path.join(dirPath, uniqueName))) {
    uniqueName = `${baseName} (${counter})${ext}`;
    counter++;
  }

  return uniqueName;
};

export const uploadClientDocument = async (req, res) => {
  const { id } = req.params;
  const { folderName, subFolderName } = req.body;
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const client = await AllClientsModel.findOne({ Mou_no: id });
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    const clientFolderPath = path.join(
      process.env.DOCUMENT_PATH,
      client.CSS,
      client.BranchLocation,
      `${client.Mou_no}_${client.CustomerName}`,
      folderName,
      subFolderName
    );
    await fs.promises.mkdir(clientFolderPath, { recursive: true });

    // Generate unique file name if needed
    const uniqueFileName = await generateUniqueName(clientFolderPath, file.originalname);
    const filePath = path.join(clientFolderPath, uniqueFileName);

    await fs.promises.writeFile(filePath, file.buffer);
    res.status(200).json({ success: true, message: "Document uploaded successfully" });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const copyClientFiles = async (req, res) => {
  const { id } = req.params;
  const { selectedFiles, targetFolder, subFolderName } = req.body;

  try {
    const client = await AllClientsModel.findOne({ Mou_no: id });
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    const targetPath = path.join(
      process.env.DOCUMENT_PATH,
      client.CSS,
      client.BranchLocation,
      `${client.Mou_no}_${client.CustomerName}`,
      targetFolder,
      subFolderName
    );
    await fs.promises.mkdir(targetPath, { recursive: true });

    for (const file of selectedFiles) {
      const sourceFile = path.join(process.env.DOCUMENT_PATH, file);
      const uniqueFileName = await generateUniqueName(targetPath, path.basename(file));
      const targetFile = path.join(targetPath, uniqueFileName);

      await fs.promises.copyFile(sourceFile, targetFile);
    }

    res.status(200).json({ success: true, message: "Files copied successfully" });
  } catch (error) {
    console.error("Error copying files:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};





  // Add a new commitment to a client's record with the name of the user who added it
// In ClientController.js
export const addCommitment = async (req, res) => {
  const { Mou_no } = req.params; // Client's Mou_no
  const { commitment, deadline } = req.body; // Exclude 'name' from request body
  const name = req.user.name; // Get user name from req.user

  try {
    const client = await AllClientsModel.findOne({ Mou_no });
    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    // Create new commitment with user's name
    const newCommitment = {
      commitment,
      deadline,
      name, // Set the user's name from req.user
      status: 'not done',
      timestamp: new Date(),
    };

    client.Commitments.push(newCommitment);
    await client.save();

    res.status(200).json({ message: 'Commitment added successfully.', commitment: newCommitment });
  } catch (error) {
    console.error('Error adding commitment:', error);
    res.status(500).json({ message: 'Failed to add commitment.' });
  }
};




const createSubmissionFolders = async (req, res) => {
  const clientId = req.params.id;
  const subfolders = [
    "Questionaire",
    "Business Plan",
    "Bank Statements",
    "Review Documents",
    "EB Refusal & Appeal",
    "EB Endorsement Letter",
    "Home Office Queries",
    "Background Profile",
    "Supporting Documents",
    "Residential Proof",
    "Identification Proof"
  ];

  try {
    const client = await AllClientsModel.findOne({ Mou_no: clientId });
    if (!client || !client.DocumentFolder) {
      return res.status(404).json({ message: "Client document folder not found." });
    }

    const clientFolderPath = path.join(process.env.DOCUMENT_PATH, client.CSS, client.BranchLocation, `${client.Mou_no}_${client.CustomerName}`);

    if (!fs.existsSync(clientFolderPath)) {
      fs.mkdirSync(clientFolderPath, { recursive: true });
    }

    // Determine the next Submission folder number
    let submissionCount = 1;
    while (fs.existsSync(path.join(clientFolderPath, `Submission ${submissionCount}`))) {
      submissionCount++;
    }

    // Create the new "Submission" folder
    const submissionFolderPath = path.join(clientFolderPath, `Submission ${submissionCount}`);
    fs.mkdirSync(submissionFolderPath, { recursive: true });

    // Create subfolders with suffix indicating submission number
    subfolders.forEach((subfolder) => {
      const subfolderPath = path.join(submissionFolderPath, `${subfolder} ${submissionCount}`);
      fs.mkdirSync(subfolderPath, { recursive: true });
    });

    res.status(201).json({
      message: `Created Submission ${submissionCount} folder with subfolders`,
      folderPath: submissionFolderPath
    });
  } catch (error) {
    console.error("Error creating submission folders:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const generateClientSummaryPrompt = async (req, res) => {
  try {
    const { id } = req.params; // The client's Mou_no
    const client = await AllClientsModel.findOne({ Mou_no: id });

    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    // Concise client details header
    let prompt = `## **Client Case Study: ${client.CustomerName}**\n\n`;
    prompt += `### **Client Overview**:\n`;
    prompt += `- **Branch Location**: ${client.BranchLocation}\n`;
    prompt += `- **Visa Category**: ${client.VisaCatagory}\n`;
    prompt += `- **Client Status**: ${client.Status || "Not Available"}\n`;
    prompt += `- **Stage**: ${client.Stage}\n\n`;

    // Case Overview with flags and commitment count
    prompt += "### **Case Overview**:\n";
    prompt += `- **Flag**: ${client.Flag} ${client.Flag === "red" ? "(Critical)" : "(Normal)"}\n`;
    prompt += `- **Total Comments**: ${client.LatestComments.length}\n`;
    
    // Commitment summary with a clear table of commitments and their status
    prompt += "\n### **Commitment Summary**:\n";
    prompt += "| # | Commitment | Deadline | Status |\n";
    prompt += "|---|------------|----------|--------|\n";
    client.Commitments.forEach((commitment, index) => {
      const deadline = new Date(commitment.deadline).toLocaleDateString();
      prompt += `| ${index + 1} | ${commitment.commitment} | ${deadline} | ${commitment.status} |\n`;
    });

    // Checklist overview with completion status and timestamps
    prompt += "\n### **Checklist Status**:\n";
    prompt += "| Checklist Item | Status | Last Updated |\n";
    prompt += "|----------------|--------|--------------|\n";
    Object.entries(client.Checklist).forEach(([key, value]) => {
      const status = value.value ? "Completed" : "Pending";
      const date = value.timestamp ? new Date(value.timestamp).toLocaleDateString() : "N/A";
      prompt += `| ${key} | ${status} | ${date} |\n`;
    });

    // Critical highlights with expiry dates
    prompt += "\n### **Critical Highlights**:\n";
    prompt += "| # | Critical Highlight | Expiry Date |\n";
    prompt += "|---|--------------------|-------------|\n";
    client.CriticalHighlights.forEach((highlight, index) => {
      const expiryDate = highlight.expiryDate ? new Date(highlight.expiryDate).toLocaleDateString() : "No Expiry";
      prompt += `| ${index + 1} | ${highlight.criticalHighlight} | ${expiryDate} |\n`;
    });

    // EB submissions with results
    prompt += "\n### **EB Submission Updates**:\n";
    prompt += "| # | EB Submission | Result | Date |\n";
    prompt += "|---|---------------|--------|------|\n";
    client.SubmittedEB.forEach((eb, index) => {
      const date = eb.Date ? new Date(eb.Date).toLocaleDateString() : "N/A";
      prompt += `| ${index + 1} | ${eb.EB} | ${eb.Result || "Pending"} | ${date} |\n`;
    });

    // Comments analysis with breakdown of types (Issue/Request)
    prompt += "\n### **Comments Overview**:\n";
    prompt += "| # | Comment | By | Date | Type |\n";
    prompt += "|---|---------|----|------|------|\n";
    client.LatestComments.forEach((comment, index) => {
      const date = new Date(comment.timestamp).toLocaleString();
      const type = comment.comment.includes("issue") ? "Issue" : "Request/Update";
      prompt += `| ${index + 1} | ${comment.comment} | ${comment.name} | ${date} | ${type} |\n`;
    });

    // Key insights with a structured analysis of challenges, important dates, and next steps
    prompt += "\n### **Key Insights & Analysis**:\n";
    prompt += `- **Important Dates**: Review all key deadlines, updates, and actions.\n`;
    prompt += `- **Current Challenges**: Highlight ongoing issues or roadblocks.\n`;
    prompt += `- **Next Steps**: Suggested actions or recommendations for moving forward.\n`;
    prompt += `- **Action Required**: Indicate urgency and recommended follow-up.\n`;

    // Return the comprehensive analysis prompt
    res.status(200).json({ success: true, prompt });
  } catch (error) {
    console.error("Error generating client summary prompt:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};




// Controller to update the pinned status of a client
const togglePinnedStatus = async (req, res) => {
  try {
    const { id } = req.params; // Get Mou_no from URL parameters

    // Find the client by Mou_no and toggle the PinnedStatus field
    const client = await AllClientsModel.findOne({ Mou_no: id });

    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    // Toggle the PinnedStatus between 'pinned' and 'unPinned'
    const newStatus = client.PinnedStatus === 'pinned' ? 'unPinned' : 'pinned';

    // Update the client's PinnedStatus field
    client.PinnedStatus = newStatus;
    await client.save();

    res.status(200).json({ success: true, message: `Client has been ${newStatus}`, client });
  } catch (error) {
    console.error("Error toggling pinned status:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
const updateOldCSS = async (req, res) => {
  try {
    // Retrieve the list of Mou_nos (or other identifiers) to be updated from the request body
    const { mouNos } = req.body;  // Assuming mouNos is an array of client identifiers

    if (!Array.isArray(mouNos)) {
      return res.status(400).json({ success: false, message: 'Invalid data format for mouNos' });
    }

    // Process each client
    for (const mouNo of mouNos) {
      const client = await AllClientsModel.findOne({ Mou_no: mouNo });

      if (!client) {
        return res.status(404).json({ success: false, message: `Client with Mou_no ${mouNo} not found` });
      }

      const currentDate = new Date();

      // Update OldCSS with the current CSS and the current date
      client.oldCSS = {
        CSS: client.CSS,
        Date: currentDate
      };

      // Save the client document with the updated OldCSS
      await client.save();
    }

    // Send a success response after updating all clients
    res.status(200).json({ success: true, message: 'OldCSS updated successfully' });
  } catch (error) {
    console.error('Error updating OldCSS:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


// Controller to fetch all commitments across all clients
export const getAllCommitments = async (req, res) => {
  try {
    // Fetching all commitments and including necessary client details
    const commitments = await AllClientsModel.aggregate([
      {
        $unwind: "$Commitments"  // Flatten the Commitments array
      },
      {
        $project: {
          commitment: "$Commitments.commitment",
          deadline: "$Commitments.deadline",
          name: "$Commitments.name",
          status: "$Commitments.status",
          Mou_no: 1,  // Including Mou_no of the client
          CustomerName: 1,  // Client's name
          CSS: 1,  // Client's CSS
          Stage: 1,  // Client's stage
        }
      }
    ]);

    res.status(200).json({ success: true, commitments });
  } catch (error) {
    console.error("Error fetching commitments:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Controller to fetch all critical highlights across all clients
export const getAllCriticalHighlights = async (req, res) => {
  try {
    // Fetching all critical highlights and including necessary client details
    const criticalHighlights = await AllClientsModel.aggregate([
      {
        $unwind: "$CriticalHighlights"  // Flatten the CriticalHighlights array
      },
      {
        $project: {
          criticalHighlight: "$CriticalHighlights.criticalHighlight",
          expiryDate: "$CriticalHighlights.expiryDate",
          status: "$CriticalHighlights.status",
          Mou_no: 1,  // Including Mou_no of the client
          CustomerName: 1,  // Client's name
          CSS: 1,  // Client's CSS
          Stage: 1,  // Client's stage
        }
      }
    ]);

    res.status(200).json({ success: true, criticalHighlights });
  } catch (error) {
    console.error("Error fetching critical highlights:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// Get all clients 
const getAllClients = async (req, res) => {
  try {
    const { status, name, clientName, mouNo } = req.query; // Fetch filter params if any

    // Build query object based on incoming filters
    const query = {};

    if (clientName) query.CustomerName = new RegExp(clientName, 'i');
    if (mouNo) query.Mou_no = new RegExp(mouNo, 'i');
    
    // Retrieve only the necessary fields and filter based on params
    const clients = await AllClientsModel.find(query, 'CustomerName Mou_no CSS Commitments CriticalHighlights');

    // Optionally filter data on the server side for better performance
    const filteredClients = clients.map(client => {
      let commitmentsData = client.Commitments || [];
      let criticalHighlightsData = client.CriticalHighlights || [];

      if (status) {
        commitmentsData = commitmentsData.filter(commitment => commitment.status.toLowerCase() === status.toLowerCase());
        criticalHighlightsData = criticalHighlightsData.filter(highlight => highlight.status.toLowerCase() === status.toLowerCase());
      }

      return {
        ...client._doc,
        Commitments: commitmentsData,
        CriticalHighlights: criticalHighlightsData
      };
    });

    res.status(200).json({ success: true, clients: filteredClients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


export {
  uploadExcel,
  getClientDetails,
  updateClientDetails,
  getClients,
  addComment,
  addCriticalHighlight,
  addSubmittedEB,
  shiftCSS,
  editLatestComment,
  deleteLatestComment,
  editSubmittedEB,
  deleteSubmittedEB,
  editCriticalHighlight,
  deleteCriticalHighlight,
  createSubmissionFolders,
  generateClientSummaryPrompt,
  updateCriticalHighlightStatus,
  togglePinnedStatus,
  updateOldCSS,
  getAllClients
};
