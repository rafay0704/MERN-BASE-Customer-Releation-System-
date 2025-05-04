import LeaveModel from "../models/Leave.js";

export const createLeave = async (req, res) => {
    console.log("Received request body:", req.body); // Debugging line
    try {
        const leave = new LeaveModel(req.body);
        await leave.save();
        res.status(201).json({ success: true, leave });
    } catch (error) {
        console.error("Error creating leave:", error);
        res.status(500).json({ success: false, message: "Error creating leave", error: error.message });
    }
};


export const getLeaves = async (req, res) => {
    console.log("Received request at /api/auth/leaves"); // Debugging line
    try {
        const leaves = await LeaveModel.find();
        res.status(200).json({ success: true, leaves });
    } catch (error) {
        console.error("Error fetching leaves:", error);
        res.status(500).json({ success: false, message: "Error fetching leaves" });
    }
};

export const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const leave = await LeaveModel.findByIdAndUpdate(id, { status }, { new: true });
        res.status(200).json({ success: true, leave });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating leave status" });
    }
};

export const deleteLeave = async (req, res) => {
    try {
        await LeaveModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Leave deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting leave" });
    }
};
