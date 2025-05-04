// routes/CSSRoutes.js
import express from 'express';
import multer from 'multer';
import { isCSSUser } from '../middleware/verifyToken.js';
import {
    getClientsForCSS,
    getClientDetailsForCSS,
    getClientDetailsByMouAndName,
    generateBatch,
    
    getLastBatchForCSS,
    getBatchesByDate // Import the new controller
   
} from '../controllers/CSSController.js';
import { addComment, addCriticalHighlight, addSubmittedEB, updateClientDetails, uploadClientDocument } from '../controllers/ClientController.js';
import { getClientDocuments , createSubmissionFolders } from '../controllers/ClientController.js';
import { getClientDetails , copyClientFiles } from '../controllers/ClientController.js';
import { updateClientMedium , getUpcomingCommitments} from '../controllers/CSSController.js';

import { addCommitment , updateCommitmentStatus  ,togglePinnedStatus , generateClientSummaryPrompt, updateCriticalHighlightStatus } from '../controllers/ClientController.js';

import {
    generateCriticalBatch,
    getLastCriticalBatch,
    updateCriticalClientMedium
} from '../controllers/CriticalClientsBatch.js'; // Import Critical Client Batch APIs
import { getUserCriticalClientStats } from '../controllers/CriticalClientsBatch.js';
const CSSRoutes = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Add routes for batch operations
CSSRoutes.post('/generate-batch', isCSSUser, generateBatch);
CSSRoutes.get('/last-batch', isCSSUser, getLastBatchForCSS);
CSSRoutes.post('/batches-by-date', isCSSUser, getBatchesByDate); // New route for fetching batches by date

// Existing routes
CSSRoutes.post('/client/:id/upload', isCSSUser, upload.single('document'), uploadClientDocument);
// routes/CSSRoutes.js
CSSRoutes.post('/client/:id/copy-files', isCSSUser, copyClientFiles);

CSSRoutes.post('/client/:id/createSubmission', isCSSUser , createSubmissionFolders);
CSSRoutes.get('/my-clients', isCSSUser, getClientsForCSS);
// CSSRoutes.get('/client/:id', getClientDetails);
CSSRoutes.get('/client/:id', getClientDetails);
CSSRoutes.put('/client/:id', isCSSUser, updateClientDetails);
CSSRoutes.post('/client/:id/comment', isCSSUser, addComment);
CSSRoutes.post('/client/:id/critical-highlight', isCSSUser, addCriticalHighlight);
CSSRoutes.post('/client/:id/submitted-eb', isCSSUser, addSubmittedEB);
CSSRoutes.get('/client/:id/documents', isCSSUser, getClientDocuments);
CSSRoutes.post('/client/details', isCSSUser, getClientDetailsByMouAndName); // Use POST if you're sending data in the body
CSSRoutes.post('/client/:Mou_no/commitments',isCSSUser , addCommitment); // Route to add a new commitment
CSSRoutes.put('/client/:Mou_no/commitments/:commitmentId', isCSSUser , updateCommitmentStatus); // Route to update commitment status
CSSRoutes.put('/client/:Mou_no/medium', isCSSUser, updateClientMedium);

CSSRoutes.get('/upcoming-commitments', isCSSUser, getUpcomingCommitments);
CSSRoutes.get('/client/:id/summary-prompt', generateClientSummaryPrompt);
// New route to update the status of a critical highlight
CSSRoutes.put('/client/:id/critical-highlight/:highlightId/status', isCSSUser, updateCriticalHighlightStatus);
CSSRoutes.put('/client/:id/toggle-pinned', isCSSUser, togglePinnedStatus);

// Critical Client Batch Operations
CSSRoutes.post('/critical-batch/generate', isCSSUser, generateCriticalBatch); // Generate critical client batch
CSSRoutes.get('/critical-batch/last', isCSSUser, getLastCriticalBatch); // Fetch last critical client batch
CSSRoutes.get('/critical-client-stats', isCSSUser, getUserCriticalClientStats);
CSSRoutes.put('/critical-batch/update-medium/:Mou_no', isCSSUser, updateCriticalClientMedium); // Update medium for critical client

// Existing Routes
export default CSSRoutes;
