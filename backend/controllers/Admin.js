import AllClientsModel from '../models/AllClients.js';
import UserModel from '../models/user.js';
import DailyClientsModel from '../models/DailyClients.js';
import moment from 'moment';

const Getuser = async (req, res) => {
    try {
        const users = await UserModel.find();
        res.status(200).json({ success: true, users });
        
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
        console.error(error); // Log the error for debugging
    }
};
const Deleteuser = async (req, res) => {
    try {
        const userId = req.params.id;
        const checkAdmin = await UserModel.findById(userId)
        if(checkAdmin.role == "admin") {
            return res.status(404).json({ success: false, message: "Admin cannot delete own id" });

        }
        const user = await UserModel.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
        console.log("Error deleting user:", error); // Log the error for debugging
    }
};


export const getAllCSSDetails = async (req, res) => {
    try {
        // Fetch all CSS users
        const cssUsers = await UserModel.find({ role: 'user', designation: 'CSS' });
        const cssUserNames = cssUsers.map(user => user.name);

        // Fetch all active clients grouped by CSS
        const activeClients = await AllClientsModel.aggregate([
            { 
                $match: { 
                    Stage: 'Active',  // Only consider clients in the 'Active' stage
                    CSS: { $in: cssUserNames }  // Ensure clients are assigned to CSS users
                }
            },
            { 
                $group: { 
                    _id: "$CSS",  // Group by CSS user
                    totalClients: { $sum: 1 },
                    clients: { $push: "$Mou_no" }  // Collect Mou_no for each client
                }
            }
        ]);

        // Map CSS names to active client stats for easier lookup
        const clientStatsMap = activeClients.reduce((acc, curr) => {
            acc[curr._id] = {
                totalClients: curr.totalClients,
                clients: curr.clients
            };
            return acc;
        }, {});

        // Fetch DailyClients data for all CSS users who have active clients
        const dailyClientDataList = await DailyClientsModel.find({ cssUser: { $in: Object.keys(clientStatsMap) } });
        const dailyClientDataMap = dailyClientDataList.reduce((acc, curr) => {
            acc[curr.cssUser] = curr;
            return acc;
        }, {});

        // Build CSS statistics
        const cssStats = cssUsers
            .filter(cssUser => clientStatsMap[cssUser.name])  // Only include users with active clients
            .map(cssUser => {
                const userName = cssUser.name;
                const clientStats = clientStatsMap[userName] || { totalClients: 0, clients: [] };
                const dailyClientData = dailyClientDataMap[userName];

                const totalClients = clientStats.totalClients;
                const totalBatches = Math.ceil(totalClients / 20);

                let lastBatchClientsCount = 0;
                let lastBatchGeneratedDate = null;
                let nextBatchClientsCount = 0;
                let remainingBatches = 0;
                let cycleCount = 0;

                if (dailyClientData && dailyClientData.cycles.length > 0) {
                    cycleCount = dailyClientData.cycles.length;

                    const lastCycle = dailyClientData.cycles[dailyClientData.cycles.length - 1];
                    const lastBatch = lastCycle.batches[lastCycle.batches.length - 1];

                    lastBatchClientsCount = lastBatch.mous.length;
                    lastBatchGeneratedDate = lastBatch.batchDate;

                    // Calculate remaining MOUs
                    const usedMous = dailyClientData.cycles.flatMap(cycle =>
                        cycle.batches.flatMap(batch => batch.mous)
                    );

                    const remainingMous = clientStats.clients.filter(mou => !usedMous.includes(mou));

                    // Dynamically calculate remaining batches and next batch client count
                    nextBatchClientsCount = Math.min(remainingMous.length, 20);
                    remainingBatches = Math.ceil(remainingMous.length / 20);
                }

                return {
                    cssUser: userName,
                    totalClients,
                    totalBatches,
                    cycleCount,
                    lastBatchClientsCount,
                    lastBatchGeneratedDate,
                    nextBatchClientsCount,
                    remainingBatches
                };
            });

        res.status(200).json({ success: true, cssStats });
    } catch (error) {
        console.error('Error fetching CSS details:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};





export const getMouDataByDateRange = async (req, res) => {
    try {
        const { cssUser, startDate, endDate } = req.body; // Get CSS user and date range from request body

        // Check if the user making the request is an admin
        const userId = req.user.id;
        const user = await UserModel.findById(userId);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        // Format the start and end dates
        const formattedStartDate = moment(startDate).startOf('day');
        const formattedEndDate = moment(endDate).endOf('day'); // Include the end date

        // Find the daily client record for the specified CSS user
        const dailyClient = await DailyClientsModel.findOne({ cssUser });

        if (!dailyClient) {
            return res.status(404).json({ success: false, message: 'No data found for the specified CSS user' });
        }

        // Filter batches based on the date range
        const batchesInRange = dailyClient.cycles.flatMap(cycle => 
            cycle.batches.filter(batch => 
                moment(batch.batchDate).isBetween(formattedStartDate, formattedEndDate, null, '[]') // Inclusive of start and end dates
            )
        );

        // Extract MOU data and fetch additional client details from the AllClients collection
        const mouData = await Promise.all(batchesInRange.flatMap(async batch => 
            Promise.all(batch.mous.map(async mou => {
                // Fetch additional client data using Mou_no and CustomerName
                const client = await AllClientsModel.findOne({ Mou_no: mou.mou, CustomerName: mou.customerName });

                if (!client) {
                    return null; // Handle case where client is not found
                }

                // Extract latest comments for the batch date
                const latestCommentsOnBatchDate = client.LatestComments.filter(comment =>
                    moment(comment.timestamp).isSame(moment(batch.batchDate), 'day')
                );

                return {
                    mou: client.Mou_no,
                    customerName: client.CustomerName,
                    batchDate: batch.batchDate,
                    date: client.Date,
                    visaCategory: client.VisaCatagory,
                    phone: client.Phone,
                    mobile: client.Mobile,
                    nationality: client.Nationality,
                    branch: client.BranchLocation,
                    advisor: client.SalesAdvisor,
                    css: client.CSS,
                    status: client.Status,
                    medium: mou.medium, // Add this line to include the medium
                    latestComments: latestCommentsOnBatchDate // Include latest comments of the batch date
                };
            }))
        ));

        const filteredMouData = mouData.filter(mou => mou !== null); // Filter out null entries

        if (filteredMouData.length === 0) {
            return res.status(404).json({ success: false, message: 'No MOUs found for the selected CSS user and date range' });
        }

        res.status(200).json({ success: true, mouData: filteredMouData });
    } catch (error) {
        console.error('Error fetching MOU data by date range:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getAllLastBatches = async (req, res) => {
    try {
        // Fetch only active CSS users from the Users database
        const activeCssUsers = await UserModel.find({ designation: 'CSS', status: 'active' });

        // Extract the names of active CSS users
        const cssUserNames = activeCssUsers.map(user => user.name);

        // Fetch all clients but only include those whose cssUser name matches the active CSS users
        const allClients = await DailyClientsModel.find({ cssUser: { $in: cssUserNames } });

        // Wait for all client batches processing
        const lastBatches = await Promise.all(allClients.map(async (client) => {
            const lastCycle = client.cycles.sort((a, b) => b.cycleNumber - a.cycleNumber)[0];
            if (!lastCycle || lastCycle.batches.length === 0) return null;

            const lastBatch = lastCycle.batches.sort((a, b) => new Date(b.batchDate) - new Date(a.batchDate))[0];

            // Fetch client comments based on MOU in batch
            const batchMous = lastBatch.mous;
            const comments = await Promise.all(batchMous.map(async (mou) => {
                // Match MOU with AllClientsModel
                const clientInAllClients = await AllClientsModel.findOne({ Mou_no: String(mou.mou) }); // Ensure both MOU are strings
                if (!clientInAllClients) {
                    // console.log(`No client found for MOU: ${mou.mou}`);
                    return null;
                }

                // Fetch the latest comment from the LatestComments array
                const latestComment = clientInAllClients.LatestComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]; // Sort comments by timestamp (latest first)

                if (latestComment) {
                    // console.log(`Latest comment found for MOU ${mou.mou}: ${latestComment.comment}`);
                    return { mou: mou.mou, comments: [latestComment] };
                } else {
                    return null;
                }
            }));

            // Remove null results (no comments found) after Promise.all()
            const validComments = comments.filter(c => c !== null);

            // If we have any valid comments, return them, else skip this batch
            return {
                cssUser: client.cssUser,
                cycleNumber: lastCycle.cycleNumber,
                batchDate: lastBatch.batchDate,
                mous: lastBatch.mous,
                comments: validComments.length > 0 ? validComments : null // Include comments if found
            };
        }));

        // Remove null batches (in case no valid data was found)
        const validBatches = lastBatches.filter(batch => batch !== null);

        res.status(200).json({ success: true, data: validBatches });
    } catch (error) {
        console.error("Error fetching batches and comments:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};







export { Getuser , Deleteuser };






