import mongoose from "mongoose";
import cron from "node-cron";
import moment from "moment";
import AllClientsModel from "../models/AllClients.js";
import CriticalNotificationModel from "../models/CriticalNotificationSchema.js";

/**
 * Schedule commitment and critical highlight notifications and store them in the database.
 * @param {Object} io - The Socket.IO instance for real-time communication.
 */
export const scheduleCommitmentAndCriticalHighlightNotifications = (io) => {
  const sentNotifications = new Map(); // Track notifications to prevent duplicates

  cron.schedule("*/1 * * * *", async () => {
    const now = moment(); // Current time

    const thresholds = {
      preExpiry: [48 * 3600, 24 * 3600, 2 * 3600, 15 * 60, 60], // in seconds
      postExpiry: 3 * 3600, // in seconds
    };

    try {
      const clients = await AllClientsModel.find({
        $or: [
          { "Commitments.status": "not done" },
          { "CriticalHighlights.status": "not catered" },
        ],
      });

      const notifications = []; // Batch notifications for database insert

      for (const client of clients) {
        const { _id: clientId, CustomerName, CSS, Mou_no, Commitments, CriticalHighlights } = client;

        if (!sentNotifications.has(clientId)) {
          sentNotifications.set(clientId, new Set());
        }

        processItems(
          Commitments,
          "commitment",
          thresholds,
          now,
          client,
          sentNotifications,
          notifications
        );

        processItems(
          CriticalHighlights,
          "critical highlight",
          thresholds,
          now,
          client,
          sentNotifications,
          notifications
        );
      }

      if (notifications.length > 0) {
        await insertAndEmitNotifications(notifications, io);
      }
    } catch (error) {
      console.error("Error scheduling notifications:", error);
    }
  });
};

/**
 * Process commitments or critical highlights for pre/post expiry notifications.
 * @param {Array} items - List of commitments or critical highlights.
 * @param {string} type - Type of items ("commitment" or "critical highlight").
 * @param {Object} thresholds - Notification thresholds.
 * @param {Moment} now - Current moment.
 * @param {Object} client - Client object.
 * @param {Map} sentNotifications - Sent notifications tracker.
 * @param {Array} notifications - Batch notification array.
 */
const processItems = (items, type, thresholds, now, client, sentNotifications, notifications) => {
  for (const item of items) {
    if (item.status === (type === "commitment" ? "not done" : "not catered")) {
      const deadline = moment(type === "commitment" ? item.deadline : item.expiryDate);
      const diff = deadline.diff(now, "seconds");
      const postDeadline = now.diff(deadline, "seconds");

      // Pre-Expiry Notifications
      thresholds.preExpiry.forEach((threshold) => {
        if (diff <= threshold && diff > threshold - 600) {
          const notificationKey = `${client._id}-${item[type]}-${threshold}`;

          if (!sentNotifications.get(client._id).has(notificationKey)) {
            notifications.push(
              createNotificationObject(
                type,
                client,
                type === "commitment" ? item.commitment : item.criticalHighlight, // Corrected here
                `${formatRemainingTime(threshold)} remaining before ${type === "commitment" ? "deadline" : "expiry"}!`,
                deadline
              )
            );
            sentNotifications.get(client._id).add(notificationKey);
          }
        }
      });

      // Post-Expiry Notifications
      if (postDeadline >= thresholds.postExpiry && postDeadline % thresholds.postExpiry === 0) {
        const notificationKey = `${client._id}-${item[type]}-postExpiry-${Math.floor(postDeadline / thresholds.postExpiry)}`;

        if (!sentNotifications.get(client._id).has(notificationKey)) {
          notifications.push(
            createNotificationObject(
              type,
              client,
              type === "commitment" ? item.commitment : item.criticalHighlight, // Corrected here
              `Reminder: ${type === "commitment" ? "Deadline" : "Highlight expiry"} passed ${formatElapsedTime(postDeadline)} ago! Please take action.`,
              deadline
            )
          );
          sentNotifications.get(client._id).add(notificationKey);
        }
      }
    }
  }
};

/**
 * Insert notifications into the database and emit them via Socket.IO.
 * @param {Array} notifications - Notifications to insert.
 * @param {Object} io - Socket.IO instance.
 */
const insertAndEmitNotifications = async (notifications, io) => {
  const existingNotifications = await CriticalNotificationModel.find({
    $or: notifications.map((notif) => ({
      clientId: notif.clientId,
      itemName: notif.itemName,
      message: notif.message,
      read: false,
    })),
  }).lean();

  const existingKeys = new Set(
    existingNotifications.map(
      (notif) => `${notif.clientId}-${notif.itemName}-${notif.message}`
    )
  );

  const uniqueNotifications = notifications.filter(
    (notif) =>
      !existingKeys.has(`${notif.clientId}-${notif.itemName}-${notif.message}`)
  );

  if (uniqueNotifications.length > 0) {
    await CriticalNotificationModel.insertMany(uniqueNotifications);

    uniqueNotifications.forEach((notif) => {
      io.emit(
        notif.type === "commitment"
          ? "commitmentNotification"
          : "criticalHighlightNotification",
        {
          clientId: notif.clientId,
          customerName: notif.customerName,
          cssValue: notif.cssValue,
          mouNo: notif.mouNo,
          itemName: notif.itemName,
          message: notif.message,
        }
      );
    });
  }
};

/**
 * Create a notification object.
 */
const createNotificationObject = (type, client, itemName, message, date) => {
  return {
    type,
    clientId: client._id,
    customerName: client.CustomerName,
    cssValue: client.CSS,
    mouNo: client.Mou_no,
    itemName: `${itemName} (${type === "commitment" ? "Deadline" : "Expiry"}: ${moment(date).format("YYYY-MM-DD HH:mm")})`,
    message,
    date: moment(date).format("YYYY-MM-DD HH:mm"),
    timestamp: new Date(),
    read: false,
  };
};

/**
 * Format remaining time.
 */
const formatRemainingTime = (seconds) => {
  if (seconds >= 86400) { // 1 day = 86400 seconds
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days} day${days === 1 ? "" : "s"}${hours > 0 ? `, ${hours} hour${hours === 1 ? "" : "s"}` : ""}`;
  } else if (seconds >= 3600) { // 1 hour = 3600 seconds
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  } else if (seconds >= 60) { // 1 minute = 60 seconds
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  return `${seconds} second${seconds === 1 ? "" : "s"}`;
};
/**
 * Format elapsed time.
 */
const formatElapsedTime = (seconds) => {
  const duration = moment.duration(seconds, "seconds");
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();

  const formattedParts = [];
  if (days > 0) formattedParts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours > 0) formattedParts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (minutes > 0) formattedParts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);

  if (formattedParts.length > 0) {
    return `${formattedParts.join(", ")} ago`;
  }

  return `${seconds} second${seconds === 1 ? "" : "s"} ago`;
};























// import mongoose from "mongoose";
// import cron from "node-cron";
// import moment from "moment";
// import AllClientsModel from "../models/AllClients.js";
// import CriticalNotificationModel from "../models/CriticalNotificationSchema.js";

// /**
//  * Schedule commitment and critical highlight notifications and store them in the database.
//  * @param {Object} io - The Socket.IO instance for real-time communication.
//  */
// export const scheduleCommitmentAndCriticalHighlightNotifications = (io) => {
//   // A set to track sent notifications by clientId and itemName
//   const sentNotifications = new Map();

//   cron.schedule("*/1 * * * *", async () => {
//     const now = moment(); // Current time

//     // Notification intervals in seconds
//     const thresholds = {
//       preExpiry: [48 * 3600, 24 * 3600, 2 * 3600, 15 * 60, 60],
//       postExpiry: 3 * 3600,
//     };

//     // Fetch only relevant clients with pending commitments or critical highlights
//     const clients = await AllClientsModel.find({
//       $or: [
//         { "Commitments.status": "not done" },
//         { "CriticalHighlights.status": "not catered" },
//       ],
//     });

//     const notifications = []; // Store notifications to batch insert

//     // Process each client
//     for (const client of clients) {
//       const { _id: clientId, CustomerName, CSS, Mou_no, Commitments, CriticalHighlights } = client;

//       // Track sent notifications for this client
//       if (!sentNotifications.has(clientId)) {
//         sentNotifications.set(clientId, new Set());
//       }

//       // Process Commitments
//       for (const commitment of Commitments) {
//         if (commitment.status === "not done") {
//           const deadline = moment(commitment.deadline);
//           const diff = deadline.diff(now, "seconds");
//           const postDeadline = now.diff(deadline, "seconds");

//           // Pre-Expiry Notifications for Commitments
//           thresholds.preExpiry.forEach((threshold) => {
//             if (diff <= threshold && diff > threshold - 600) {
//               // Prevent duplicate notification for the same threshold
//               if (!sentNotifications.get(clientId).has(`commitment-${commitment.commitment}-${threshold}`)) {
//                 let timeRemaining;

//                 // Calculate remaining time
//                 if (threshold >= 3600) {
//                   const hoursRemaining = Math.floor(threshold / 3600); // Round down to the nearest whole number
//                   timeRemaining = `${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'}`;
//                 } else if (threshold >= 60) {
//                   const minutesRemaining = threshold / 60;  // Don't round, as minute precision is acceptable
//                   timeRemaining = `${Math.round(minutesRemaining)} minute${minutesRemaining === 1 ? '' : 's'}`;
//                 } else {
//                   timeRemaining = `${threshold} second${threshold === 1 ? '' : 's'}`;
//                 }

//                 // Create the notification object
//                 notifications.push(createNotificationObject(
//                   "commitment",
//                   client,
//                   commitment.commitment,
//                   `${timeRemaining} remaining before deadline!`,
//                   deadline
//                 ));

//                 // Mark this threshold as notified for the commitment
//                 sentNotifications.get(clientId).add(`commitment-${commitment.commitment}-${threshold}`);
//               }
//             }
//           });

//           // Post-Expiry Notifications (every 3 hours)
//           if (postDeadline >= thresholds.postExpiry && postDeadline % thresholds.postExpiry === 0) {
//             const timePassed = formatElapsedTime(postDeadline);
//             notifications.push(
//               createNotificationObject(
//                 "commitment",
//                 client,
//                 commitment.commitment,
//                 `Reminder: Deadline passed ${timePassed} ago! Please take action.`,
//                 deadline
//               )
//             );
//           }
//         }
//       }

//       // Process Critical Highlights
//       for (const highlight of CriticalHighlights) {
//         if (highlight.status === "not catered") {
//           const expiry = moment(highlight.expiryDate);
//           const diff = expiry.diff(now, "seconds");
//           const postExpiry = now.diff(expiry, "seconds");

//           // Pre-Expiry Notifications for Critical Highlights
//           thresholds.preExpiry.forEach((threshold) => {
//             if (diff <= threshold && diff > threshold - 600) {
//               // Prevent duplicate notification for the same threshold
//               if (!sentNotifications.get(clientId).has(`highlight-${highlight.criticalHighlight}-${threshold}`)) {
//                 let timeRemaining;

//                 // Calculate remaining time
//                 if (threshold >= 3600) {
//                   const hoursRemaining = Math.floor(threshold / 3600); // Round down to the nearest whole number
//                   timeRemaining = `${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'}`;
//                 } else if (threshold >= 60) {
//                   const minutesRemaining = threshold / 60;  // Don't round, as minute precision is acceptable
//                   timeRemaining = `${Math.round(minutesRemaining)} minute${minutesRemaining === 1 ? '' : 's'}`;
//                 } else {
//                   timeRemaining = `${threshold} second${threshold === 1 ? '' : 's'}`;
//                 }

//                 // Create the notification object
//                 notifications.push(createNotificationObject(
//                   "critical highlight",
//                   client,
//                   highlight.criticalHighlight,
//                   `${timeRemaining} remaining before expiry!`,
//                   expiry
//                 ));

//                 // Mark this threshold as notified for the highlight
//                 sentNotifications.get(clientId).add(`highlight-${highlight.criticalHighlight}-${threshold}`);
//               }
//             }
//           });

//           // Post-Expiry Notifications (every 3 hours)
//           if (postExpiry >= thresholds.postExpiry && postExpiry % thresholds.postExpiry === 0) {
//             const timePassed = formatElapsedTime(postExpiry);
//             notifications.push(
//               createNotificationObject(
//                 "critical highlight",
//                 client,
//                 highlight.criticalHighlight,
//                 `Reminder: Critical highlight expired ${timePassed} ago! Please address.`,
//                 expiry
//               )
//             );
//           }
//         }
//       }
//     }

//     // Avoid inserting duplicate notifications in the database
//     if (notifications.length > 0) {
//       // Check if the notification already exists in the database
//       for (const notif of notifications) {
//         const existingNotification = await CriticalNotificationModel.findOne({
//           clientId: notif.clientId,
//           itemName: notif.itemName,
//           message: notif.message,
//           read: false, // Only check for unread notifications
//         });

//         if (!existingNotification) {
//           // If the notification doesn't exist, insert it into the database
//           await CriticalNotificationModel.create(notif);

//           // Emit the notification (send it to the client)
//           io.emit(
//             notif.type === "commitment" ? "commitmentNotification" : "criticalHighlightNotification",
//             {
//               clientId: notif.clientId,
//               customerName: notif.customerName,
//               cssValue: notif.cssValue,
//               mouNo: notif.mouNo,
//               itemName: notif.itemName,
//               message: notif.message,
//             }
//           );
//         }
//       }
//     }
//   });
// };

// /**
//  * Create a notification object.
//  * @param {string} type - The notification type ("commitment" or "critical highlight").
//  * @param {Object} client - The client object.
//  * @param {string} itemName - The name of the commitment or critical highlight.
//  * @param {string} message - The notification message.
//  * @param {Moment} date - The deadline or expiry date.
//  * @returns {Object} The notification object.
//  */
// const createNotificationObject = (type, client, itemName, message, date) => {
//   let formattedItemName = "";

//   if (type === "commitment") {
//     formattedItemName = `${itemName} (Deadline: ${moment(date).format("YYYY-MM-DD HH:mm")})`;
//   } else if (type === "critical highlight") {
//     formattedItemName = `${itemName} (Expiry: ${moment(date).format("YYYY-MM-DD HH:mm")})`;
//   }

//   return {
//     type,
//     clientId: client._id,
//     customerName: client.CustomerName,
//     cssValue: client.CSS,
//     mouNo: client.Mou_no,
//     itemName: formattedItemName,
//     message,
//     date: moment(date).format("YYYY-MM-DD HH:mm"),
//     timestamp: new Date(),
//     read: false,
//   };
// };

// /**
//  * Format the elapsed time since expiry or deadline.
//  * @param {number} elapsedSeconds - The number of seconds elapsed since expiry or deadline.
//  * @returns {string} Formatted time string (e.g., "1 day, 2 hours, 15 minutes").
//  */
// const formatElapsedTime = (elapsedSeconds) => {
//   const duration = moment.duration(elapsedSeconds, "seconds");
//   const days = Math.floor(duration.asDays());
//   const hours = duration.hours();
//   const minutes = duration.minutes();

//   let timePassed = "";
//   if (days > 0) {
//     timePassed += `${days} day${days > 1 ? "s" : ""}`;
//   }
//   if (hours > 0) {
//     timePassed += `${timePassed ? ", " : ""}${hours} hour${hours > 1 ? "s" : ""}`;
//   }
//   if (minutes > 0 || !timePassed) {
//     timePassed += `${timePassed ? ", " : ""}${minutes} minute${minutes > 1 ? "s" : ""}`;
//   }
//   return timePassed;
// };














// import mongoose from "mongoose";
// import cron from "node-cron";
// import moment from "moment";
// import AllClientsModel from "../models/AllClients.js";
// import CriticalNotificationModel from "../models/CriticalNotificationSchema.js";

// /**
//  * Schedule commitment and critical highlight notifications and store them in the database.
//  * @param {Object} io - The Socket.IO instance for real-time communication.
//  */
// export const scheduleCommitmentAndCriticalHighlightNotifications = (io) => {
//   cron.schedule("*/1 * * * *", async () => {
//     const now = moment(); // Current time
//     const thresholds = {
//       tenMinutes: 600, // 10 minutes
//       oneMinute: 60,   // 1 minute
//       postDeadlineReminder: 1800, // 30 minutes for commitments
//       postExpiryReminder: 600,    // 10 minutes for highlights
//     };

//     // Fetch only relevant clients with pending commitments or critical highlights
//     const clients = await AllClientsModel.find({
//       $or: [
//         { "Commitments.status": "not done" },
//         { "CriticalHighlights.status": "not catered" },
//       ],
//     });

//     const notifications = []; // Store notifications to batch insert

//     clients.forEach((client) => {
//       const { _id: clientId, CustomerName, CSS, Mou_no, Commitments, CriticalHighlights } = client;

//       // Process Commitments
//       Commitments?.forEach((commitment) => {
//         if (commitment.status === "not done") {
//           const deadline = moment(commitment.deadline);
//           const diff = deadline.diff(now, "seconds");
//           const postDeadline = now.diff(deadline, "seconds");

//           // Handle different time thresholds for commitment notifications
//           if (diff <= thresholds.tenMinutes && diff > thresholds.tenMinutes - 10) {
//             notifications.push(createNotificationObject("commitment", client, commitment.commitment, "10 minutes remaining before deadline!", deadline));
//           }
//           if (diff <= thresholds.oneMinute && diff > thresholds.oneMinute - 10) {
//             notifications.push(createNotificationObject("commitment", client, commitment.commitment, "1 minute remaining before deadline!", deadline));
//           }
//           if (postDeadline >= thresholds.oneMinute && postDeadline < thresholds.oneMinute + 60) {
//             notifications.push(
//               createNotificationObject(
//                 "commitment",
//                 client,
//                 commitment.commitment,
//                 `Deadline passed 1 minute ago!`,
//                 deadline
//               )
//             );
//           }
//           if (postDeadline >= thresholds.tenMinutes && postDeadline % thresholds.postDeadlineReminder === 0) {
//             const timePassed = formatElapsedTime(postDeadline); // Format elapsed time dynamically
//             notifications.push(
//               createNotificationObject(
//                 "commitment",
//                 client,
//                 commitment.commitment,
//                 `Reminder: Deadline passed ${timePassed} ago! Please take action.`,
//                 deadline
//               )
//             );
//           }
//         }
//       });

//       // Process Critical Highlights
//       CriticalHighlights?.forEach((highlight) => {
//         if (highlight.status === "not catered") {
//           const expiry = moment(highlight.expiryDate);
//           const diff = expiry.diff(now, "seconds");
//           const postExpiry = now.diff(expiry, "seconds");

//           // Handle different time thresholds for critical highlight notifications
//           if (diff <= thresholds.tenMinutes && diff > thresholds.tenMinutes - 10) {
//             notifications.push(createNotificationObject("critical highlight", client, highlight.criticalHighlight, "10 minutes remaining before expiry!", expiry));
//           }
//           if (diff <= thresholds.oneMinute && diff > thresholds.oneMinute - 10) {
//             notifications.push(createNotificationObject("critical highlight", client, highlight.criticalHighlight, "1 minute remaining before expiry!", expiry));
//           }
//           if (postExpiry >= thresholds.oneMinute && postExpiry < thresholds.oneMinute + 60) {
//             notifications.push(
//               createNotificationObject(
//                 "critical highlight",
//                 client,
//                 highlight.criticalHighlight,
//                 `Critical highlight expired 1 minute ago!`,
//                 expiry
//               )
//             );
//           }
//           if (postExpiry >= thresholds.tenMinutes && postExpiry % thresholds.postExpiryReminder === 0) {
//             const timePassed = formatElapsedTime(postExpiry); // Format elapsed time dynamically
//             notifications.push(
//               createNotificationObject(
//                 "critical highlight",
//                 client,
//                 highlight.criticalHighlight,
//                 `Reminder: Critical highlight expired ${timePassed} ago! Please address.`,
//                 expiry
//               )
//             );
//           }
//         }
//       });
//     });

//     // Insert notifications in batch and emit events
//     if (notifications.length > 0) {
//       await CriticalNotificationModel.insertMany(notifications);
//       notifications.forEach((notif) => {
//         io.emit(
//           notif.type === "commitment" ? "commitmentNotification" : "criticalHighlightNotification",
//           {
//             clientId: notif.clientId,
//             customerName: notif.customerName,
//             cssValue: notif.cssValue,
//             mouNo: notif.mouNo,
//             itemName: notif.itemName,
//             message: notif.message,
//           }
//         );
//       });
//     }
//   });
// }

// /**
//  * Create a notification object.
//  * @param {string} type - The notification type ("commitment" or "critical highlight").
//  * @param {Object} client - The client object.
//  * @param {string} itemName - The name of the commitment or critical highlight.
//  * @param {string} message - The notification message.
//  * @param {Moment} date - The deadline or expiry date.
//  * @returns {Object} The notification object.
//  */
// const createNotificationObject = (type, client, itemName, message, date) => {
//   let formattedItemName = "";
  
//   if (type === "commitment") {
//     // Format commitment item name with deadline
//     formattedItemName = `${itemName} (Deadline: ${moment(date).format("YYYY-MM-DD HH:mm")})`;
//   } else if (type === "critical highlight") {
//     // Format critical highlight item name with expiry date
//     formattedItemName = `${itemName} (Expiry: ${moment(date).format("YYYY-MM-DD HH:mm")})`;
//   }

//   return {
//     type,
//     clientId: client._id,
//     customerName: client.CustomerName,
//     cssValue: client.CSS,
//     mouNo: client.Mou_no,
//     itemName: formattedItemName, // Store the formatted item name
//     message,
//     date: moment(date).format("YYYY-MM-DD HH:mm"),
//     timestamp: new Date(),
//     read: false,
//   };
// };

// /**
//  * Format the elapsed time since expiry or deadline.
//  * @param {number} elapsedSeconds - The number of seconds elapsed since expiry or deadline.
//  * @returns {string} Formatted time string (e.g., "1 day, 2 hours, 15 minutes").
//  */
// const formatElapsedTime = (elapsedSeconds) => {
//   const duration = moment.duration(elapsedSeconds, "seconds");
//   const days = Math.floor(duration.asDays());
//   const hours = duration.hours();
//   const minutes = duration.minutes();

//   let timePassed = "";
//   if (days > 0) {
//     timePassed += `${days} day${days > 1 ? "s" : ""}`;
//   }
//   if (hours > 0) {
//     timePassed += `${timePassed ? ", " : ""}${hours} hour${hours > 1 ? "s" : ""}`;
//   }
//   if (minutes > 0 || !timePassed) { // Always include minutes if nothing else
//     timePassed += `${timePassed ? ", " : ""}${minutes} minute${minutes > 1 ? "s" : ""}`;
//   }
//   return timePassed;
// };
