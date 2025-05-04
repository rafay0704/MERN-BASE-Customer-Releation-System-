import express from 'express';
import { assignTask, getAssignedTasks, getTasksByMouNo , getTasks, updateTask, getClientDetailsByMouNo} from '../controllers/TaskController.js';
import { isCSSUser , IsUser} from '../middleware/verifyToken.js';
import { getClientDetails } from '../controllers/ClientController.js';

const TaskRoutes = express.Router();

// Route to assign a task
TaskRoutes.post('/assign-task', isCSSUser, assignTask);

// Route to get assigned tasks for the logged-in CSS user
TaskRoutes.get('/assigned-tasks', isCSSUser, getAssignedTasks);

// Route to fetch tasks by Mou_No
TaskRoutes.get('/tasks/:mouNo', isCSSUser, getTasksByMouNo);

// Route to fetch tasks based on user role and designation
TaskRoutes.get('/tasks', IsUser,  getTasks);

// Route to update task details
TaskRoutes.put('/tasks/:taskId', IsUser , updateTask);


// TaskRoutes.get("/client/:id", getClientDetails);

export default TaskRoutes;
