import TaskModel from '../models/Tasks.js';
import UserModel from '../models/user.js';
import AllClientsModel from '../models/AllClients.js';

// Assign a task
const assignTask = async (req, res) => {
  try {
    const { Mou_No, AssignerNotes, Task, AssignTo } = req.body;
    const userId = req.user.id;
    const user = await UserModel.findById(userId);

    if (user && user.role === 'user' && user.designation === 'CSS') {
      const task = new TaskModel({
        Mou_No,
        AssignerNotes,
        Task,
        AssignTo,
               AssignBy: user.name, // Automatically set to the logged-in user's name
      });

      await task.save();
      res.status(200).json({ success: true, message: 'Task assigned successfully' });
    } else {
      res.status(403).json({ success: false, message: 'Unauthorized access' });
    }
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get assigned tasks for the logged-in CSS user
const getAssignedTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);

    if (user && user.role === 'user' && user.designation === 'CSS') {
      const tasks = await TaskModel.find({ AssignBy: user.name });
      res.status(200).json({ success: true, tasks });
    } else {
      res.status(403).json({ success: false, message: 'Unauthorized access' });
    }
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Fetch tasks by Mou_No
const getTasksByMouNo = async (req, res) => {
  try {
    const { mouNo } = req.params;
    const tasks = await TaskModel.find({ Mou_No: mouNo });

    if (tasks.length > 0) {
      res.status(200).json({ success: true, tasks });
    } else {
      res.status(404).json({ success: false, message: 'No tasks found for this Mou_No' });
    }
  } catch (error) {
    console.error('Error fetching tasks by Mou_No:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
// Fetch tasks based on user role and designation
const getTasks = async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await UserModel.findById(userId);
  
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      let tasks;
  
      if (user.role === 'admin') {
        tasks = await TaskModel.find(); // Admin fetches all tasks
      } else if (user.role === 'user') {
        tasks = await TaskModel.find({ AssignTo: user.designation }); // Fetch tasks based on designation
      } else {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
      }
  
      res.status(200).json({ success: true, tasks });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };
  
  
  const updateTask = async (req, res) => {
    try {
      const { taskId } = req.params;
      const { DelivererNotes, DelivererStatus, AssignerStatus } = req.body;
      const userId = req.user.id;
      const user = await UserModel.findById(userId);
  
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      const task = await TaskModel.findById(taskId);
  
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
  
      // Deliverer: Can update DelivererNotes and DelivererStatus
      if (user.role === 'user' && user.designation === task.AssignTo) {
        task.DelivererNotes = DelivererNotes || task.DelivererNotes;
        task.DelivererStatus = DelivererStatus || task.DelivererStatus;
        task.DeliverBy = user.name || task.DeliverBy; // Update DeliverBy to the deliverer's name
      }
  
      // CSS: Can update AssignerStatus if they are the AssignBy
      if (user.role === 'user' && user.designation === 'CSS' && user.name === task.AssignBy) {
        task.AssignerStatus = AssignerStatus || task.AssignerStatus;
      }
  
      // Admin: Can update any field
      if (user.role === 'admin') {
        task.DelivererNotes = DelivererNotes || task.DelivererNotes;
        task.DelivererStatus = DelivererStatus || task.DelivererStatus;
        task.AssignerStatus = AssignerStatus || task.AssignerStatus;
      }
  
      await task.save();
      res.status(200).json({ success: true, message: 'Task updated successfully' });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };
  



const getClientDetailsByMouNo = async (req, res) => {
  try {
    const { mouNo } = req.params;
    if (!mouNo) {
      return res.status(400).json({ success: false, message: 'MouNo is required' });
    }

    const client = await AllClientsModel.findOne({ Mou_no: mouNo });

    if (client) {
      res.status(200).json({ success: true, client });
    } else {
      res.status(404).json({ success: false, message: 'Client not found' });
    }
  } catch (error) {
    console.error('Error fetching client details:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


export { assignTask, getAssignedTasks, getTasksByMouNo ,  getTasks, updateTask, getClientDetailsByMouNo};
