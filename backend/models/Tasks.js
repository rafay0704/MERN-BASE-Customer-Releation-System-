
import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  AssignDate: { type: Date, default: Date.now }, // Automatically set to the current date and time
  Mou_No: [{ type: String, required: true }],
  AssignerNotes: { type: String, required:true }, // Default to an empty string
  DelivererNotes: { type: String, default: '' }, // Default to an empty string
  Task: { type: String, required: true },
  AssignTo: { type: String, required: true }, // User ID or name
  AssignBy: { type: String, required: true }, // User ID or name
  DeliverBy: { type: String, default: '' }, // Default to an empty string
  AssignerStatus: { type: String, default: 'Pending' }, // Default to 'Pending'
  DelivererStatus: { type: String, default: 'Pending' } // Default to 'Pending'
});



const TaskModel = mongoose.model('Task', TaskSchema);

export default TaskModel;
