import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import DbCon from "./utlis/db.js";
import AuthRoutes from "./routes/Auth.js";
import AdminRoutes from "./routes/AdminRoutes.js";
import upload from "./utlis/multerConfig.js";
import CSSRoutes from "./routes/CSSRoutes.js";
import TaskRoutes from "./routes/TaskRoutes.js";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import http from "http";
import BreakModel from "./models/Breaks.js";
import CheckInModel from "./models/CheckIns.js";

import { scheduleCommitmentAndCriticalHighlightNotifications } from "./controllers/cronJobs.js";

dotenv.config();
const PORT = process.env.PORT || 4000; // You can set it to port 4000 to match your backend
const app = express();

// Database connection
DbCon();

app.use(express.json());
app.use(cookieParser());

// CORS configuration: Allow the frontend to communicate with the backend
// app.use(
//   cors({
//     credentials: true,
//     origin: process.env.FRONTEND_URL, // Use the IP and port of the frontend for CORS
//   })
// );

const allowedOrigins = process.env.FRONTEND_URL?.split(",") || [];

app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);


// Routes
app.use("/api/auth", AuthRoutes);
app.use("/api/admin", AdminRoutes);
app.use("/api/css", CSSRoutes);
app.use("/api/task", TaskRoutes);

// Static file serving
app.use("/api/documents", express.static(process.env.DOCUMENT_PATH));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  "/uploads/profile",
  express.static(path.join(__dirname, process.env.UPLOAD_PATH))
);

// Test route
app.get("/", (req, res) => {
  res.send("Test Data is sending");
});

// Create HTTP server and setup Socket.IO
const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL,
//     credentials: true
//   }
// });

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});


app.set("io", io); // Attach io to app for access in other files

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  // Listen for break start and end events
  // Inside the event listeners for Socket.IO
socket.on("startBreak", async (data) => {
  // Assuming `data` has userId and start time details
  const newBreak = new BreakModel({
    userId: data.userId,
    startTime: new Date(),
    breaks: [{ startTime: new Date(), endTime: null }],
  });

  try {
    // Save the break record to the database
    await newBreak.save();
    // Emit real-time update to all connected clients
    io.emit("breakStatusUpdated", { userId: data.userId, status: "started" });
  } catch (error) {
    console.error("Error starting break:", error);
  }
});

socket.on("endBreak", async (data) => {
  try {
    // Find the active break for the user and set the end time
    const breakRecord = await BreakModel.findOne({
      userId: data.userId,
      "breaks.endTime": null,
    });

    if (breakRecord) {
      // Update the break's end time
      const activeBreak = breakRecord.breaks.find((b) => !b.endTime);
      activeBreak.endTime = new Date();

      await breakRecord.save();
      // Emit real-time update to all connected clients
      io.emit("breakStatusUpdated", { userId: data.userId, status: "ended" });
    }
  } catch (error) {
    console.error("Error ending break:", error);
  }
});


 // Listen for check-in events
 socket.on("startCheckIn", async (data) => {
  try {
    const { userId } = data;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Start of today at midnight
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999); // End of today just before midnight

    // Find or create the user's check-in document
    let userCheckInDoc = await CheckInModel.findOne({ userId });
    if (!userCheckInDoc) {
      userCheckInDoc = new CheckInModel({
        userId,
        checkIns: [],
      });
    }

    // Check if the user has already checked in today
    const alreadyCheckedInToday = userCheckInDoc.checkIns.some(
      (checkIn) => new Date(checkIn.checkInTime) >= todayStart && new Date(checkIn.checkInTime) <= todayEnd
    );

    if (alreadyCheckedInToday) {
      io.emit("checkInStatusUpdated", { userId, status: "alreadyCheckedIn" });
      return;
    }

    // Add a new check-in for today
    userCheckInDoc.checkIns.push({
      checkInTime: new Date(),
    });

    await userCheckInDoc.save();

    // Emit the check-in status update to all connected clients
    io.emit("checkInStatusUpdated", { userId, status: "checkedIn" });

  } catch (error) {
    console.error("Error starting check-in:", error);
  }
});
 
// Listen for check-in status request and send the current status
socket.on("getCheckInStatus", async (userId) => {
  try {
    const userCheckInDoc = await CheckInModel.findOne({ userId });
    if (userCheckInDoc) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const checkInToday = userCheckInDoc.checkIns.some(
        (checkIn) => new Date(checkIn.checkInTime) >= todayStart && new Date(checkIn.checkInTime) <= todayEnd
      );

      socket.emit("checkInStatus", { userId, hasCheckedInToday: checkInToday });
    }
  } catch (error) {
    console.error("Error fetching check-in status:", error);
  }
});
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

 
});

// Now that io is initialized, you can start the cron job
scheduleCommitmentAndCriticalHighlightNotifications(io);

// Server listening
server.listen(PORT, '0.0.0.0', () => { // Listen on all network interfaces
  console.log(`Backend server is running on ${PORT}`);
});

 
// socket.on("commitmentNotification", (data) => {
//   console.log("Notification received:", data); // Check if data is coming through
//   setNotifications((prevNotifications) => [...prevNotifications, data]);
//   setIsOpen(true);
// });


