import express from "express";
import {
  Getuser,
  Deleteuser,
  getAllCSSDetails, // Added controller for fetching all CSS-related details
  getMouDataByDateRange // Added controller for fetching Mou data within a date range
} from "../controllers/Admin.js";
import { isAdmin } from "../middleware/verifyToken.js";
import excelUpload from "../utlis/excelUpload.js";
import multer from 'multer';

import {
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
  deleteCriticalHighlight, addCommitment , updateCommitmentStatus
} from "../controllers/ClientController.js";
import { uploadClientDocument, getClientDocuments,exportDataToExcel} from "../controllers/ClientController.js";
import { getClientDetailsByMouAndName } from "../controllers/CSSController.js";
import { getActiveClients, getNonActiveClients } from "../controllers/ClientController.js";
import {    getBreaksByDate} from "../controllers/BreakController.js";
import { updateOldCSS } from "../controllers/ClientController.js";
import { getCheckInsByDate } from "../controllers/CheckInsController.js";
import { getAllUsersCriticalClientStats } from "../controllers/CriticalClientsBatch.js";
import { getCriticalBatchDataByDateAndUser } from "../controllers/CriticalClientsBatch.js";
import { getAllCommitments, getAllCriticalHighlights } from "../controllers/ClientController.js";
import { getAllClients } from "../controllers/ClientController.js";
import { updateAdminCheck , getUncheckedCriticalHighlightsAndCommitments} from "../controllers/ClientController.js";
import { getClientStatuses , getClientsByYearAndStage } from "../controllers/ClientController.js";
import { getAllLastBatches  } from "../controllers/Admin.js";

const AdminRoutes = express.Router();

// Set up Multer for file uploads
const storage = multer.memoryStorage(); // Using memory storage to process the file directly in memory
const upload = multer({ storage });

AdminRoutes.get("/clients/by-year-and-stage", getClientsByYearAndStage); // Route for year-wise client counts by stage


// Route to get all files in the client's document folder
AdminRoutes.get('/client/:id/documents', isAdmin, getClientDocuments);
AdminRoutes.get("/clients/statuses", isAdmin, getClientStatuses);
AdminRoutes.get("/critical-stats", getAllUsersCriticalClientStats); // New route to fetch all users' stats


// Add new route for uploading documents
AdminRoutes.post('/client/:id/upload', isAdmin, upload.single('document'), uploadClientDocument);

// Route to get all users
AdminRoutes.get("/getuser", isAdmin, Getuser);

// Route to delete a user by id
AdminRoutes.delete("/deleteuser/:id", isAdmin, Deleteuser);

// Upload Excel file
AdminRoutes.post("/upload", isAdmin, excelUpload.single("file"), uploadExcel);

// Route to get all clients
AdminRoutes.get("/clients", isAdmin, getClients);
AdminRoutes.get("/allclients", isAdmin, getAllClients);
AdminRoutes.get("/breaks-by-date", isAdmin, getBreaksByDate);

AdminRoutes.get('/clients/active',isAdmin , getActiveClients); // Fetch active clients
AdminRoutes.get('/clients/non-active',isAdmin ,  getNonActiveClients); // Fetch non-active clients

// Route to get details of a single client by Mou_no
AdminRoutes.get("/client/:id", isAdmin, getClientDetails);

// Route to update details of a single client
AdminRoutes.put("/client/:id", isAdmin, updateClientDetails);

// Route for adding a comment
AdminRoutes.post("/client/:id/comment", isAdmin, addComment);

// Route for adding a critical highlight
AdminRoutes.post("/client/:id/critical-highlight", isAdmin, addCriticalHighlight);

// Route for adding submitted EB data
AdminRoutes.post("/client/:id/submitted-eb", isAdmin, addSubmittedEB);

// Route to shift CSS
AdminRoutes.post("/shift-css", isAdmin, shiftCSS);

// Route to edit a specific LatestComment
AdminRoutes.put("/client/:id/comment/:commentId", isAdmin, editLatestComment);

// Route to delete a specific LatestComment
AdminRoutes.delete("/client/:id/comment/:commentId", isAdmin, deleteLatestComment);

// Route to edit submitted EB data
AdminRoutes.put("/clients/:id/submittedEB/:ebId", isAdmin, editSubmittedEB);

// Route to delete submitted EB data
AdminRoutes.delete("/clients/:id/submittedEB/:ebId", isAdmin, deleteSubmittedEB);

// Route to edit a specific critical highlight
AdminRoutes.put("/clients/:id/criticalHighlight/:highlightId", isAdmin, editCriticalHighlight);

// Route to delete a specific critical highlight
AdminRoutes.delete("/clients/:id/criticalHighlight/:highlightId", isAdmin, deleteCriticalHighlight);

// Route to get all CSS users and details for daily clients, including batch stats and MOU information
AdminRoutes.get("/css-user-stats", isAdmin, getAllCSSDetails);

// Route to get MOU data for CSS within a specific date range
AdminRoutes.post("/css-mou-by-date", isAdmin, getMouDataByDateRange);
AdminRoutes.post('/client/details', isAdmin, getClientDetailsByMouAndName); // Use POST if you're sending data in the body
AdminRoutes.post('/client/:Mou_no/commitments',isAdmin , addCommitment); // Route to add a new commitment
AdminRoutes.put('/client/:Mou_no/commitments/:commitmentId', isAdmin, updateCommitmentStatus); // Route to update commitment status

// Route to get details of a single client by Mou_no
AdminRoutes.get("/client/exportExcel", isAdmin, exportDataToExcel);
AdminRoutes.post('/update-old-css', updateOldCSS);  // Set up the route for updating OldCSS
AdminRoutes.get('/check-ins-by-date', getCheckInsByDate);
AdminRoutes.post('/batch-data-by-date-and-user', getCriticalBatchDataByDateAndUser);

// Endpoint to fetch all commitments
AdminRoutes.get('/allcommitments', getAllCommitments);

// Endpoint to fetch all critical highlights
AdminRoutes.get('/allcritical-highlights', getAllCriticalHighlights);



// Route to fetch all unchecked critical highlights and commitments
AdminRoutes.get('/unchecked-highlights-commitments', getUncheckedCriticalHighlightsAndCommitments); 
// Route to update AdminCheck (new route added for your function)
AdminRoutes.put('/client/:Mou_no/commitments/:commitmentId/admincheck', isAdmin, updateAdminCheck); // Route for commitment AdminCheck update
AdminRoutes.put('/client/:Mou_no/critical-highlight/:highlightId/admincheck', isAdmin, updateAdminCheck); // Route for critical highlight AdminCheck update


AdminRoutes.get('/last-batches', getAllLastBatches); // ✅ Get last batch for all CSS users

export default AdminRoutes;
