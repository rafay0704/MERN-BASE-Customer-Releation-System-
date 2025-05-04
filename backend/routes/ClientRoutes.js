import express from 'express';
import upload from '../utlis/multerConfig.js';
import { uploadExcel } from '../controllers/AllClients.js';
import { isAdmin } from '../middleware/verifyToken.js';


const AllClientsRoutes = express.Router();

AllClientsRoutes.post('/upload', isAdmin, upload.single('file'), uploadExcel);

export default AllClientsRoutes;
