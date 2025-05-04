import express from 'express';
import { register, login, logout, CheckUser , getProfilePictureByName, toggleUserStatus} from '../controllers/Auth.js';
import upload from '../utlis/multerConfig.js';
import { IsUser } from '../middleware/verifyToken.js';
import { startBreak, endBreak , getBreakStatus} from '../controllers/BreakController.js';
import { dailyCheckIn } from '../controllers/CheckInsController.js';
import { getCheckInStatus } from '../controllers/CheckInsController.js';
import { getAllNotifications, getNotificationsByCssValue , updateNotificationStatus, clearReadNotifications} from '../controllers/CrticalNotifcationFetch.js';
import { isAdmin } from "../middleware/verifyToken.js";
import { createLeave, getLeaves, updateLeaveStatus, deleteLeave } from '../controllers/LeaveController.js';

const AuthRoutes = express.Router();

AuthRoutes.post('/register', upload.single('profilePicture'), register);
AuthRoutes.post('/login', login);
AuthRoutes.post('/logout', logout);
AuthRoutes.get('/CheckUser', IsUser, CheckUser);
AuthRoutes.get('/profile-picture/:name', getProfilePictureByName); // New route for fetching profile picture by name
AuthRoutes.post("/startbreak", startBreak);
AuthRoutes.post("/endbreak", endBreak);
AuthRoutes.get('/status/:userId', getBreakStatus);

AuthRoutes.post('/check-in', dailyCheckIn); // Route for checking in
AuthRoutes.get('/check-in-status/:userId', getCheckInStatus); // Route to fetch check-in status

// Fetch all notifications (admin)
AuthRoutes.get('/notifications',  getAllNotifications);

// Fetch notifications based on name 
AuthRoutes.get('/notifications/:name', getNotificationsByCssValue);
// Ensure the backend API path matches
AuthRoutes.post('/notifications/:notificationId', updateNotificationStatus);
AuthRoutes.post('/toggle-status/:userId',isAdmin, toggleUserStatus);
AuthRoutes.delete('/notifications/clear', clearReadNotifications); // Route to clear all read notifications (admin)

AuthRoutes.post("/bookleaves", createLeave);
AuthRoutes.get("/leaves", getLeaves);
AuthRoutes.put("/leaves/:id", updateLeaveStatus);
AuthRoutes.delete("/leaves/:id", deleteLeave);



export default AuthRoutes;
