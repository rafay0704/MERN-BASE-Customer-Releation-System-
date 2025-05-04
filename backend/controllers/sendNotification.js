import moment from 'moment';
import AllClientsModel from '../models/AllClients.js';
import UserModel from "../models/user.js";
import { Server } from "socket.io";

// Function to calculate time differences and send popups
const checkAndSendPopups = async (io, userId) => {
  // Get the logged-in user
  const user = await UserModel.findById(userId);

  if (!user) {
    console.error('User not found!');
    return;
  }

  // If user is admin, show popups for all clients, else show only relevant ones
  const clients = user.role === 'admin' ? await AllClientsModel.find() : await AllClientsModel.find({ CSS: user.name });

  clients.forEach((client) => {
    // Check commitments
    client.Commitments.forEach((commitment) => {
      if (commitment.status === 'not done') {
        const timeDiff = moment(commitment.deadline).diff(moment(), 'minutes');
        if (timeDiff <= 48 * 60 && timeDiff > 24 * 60) {
          // Show 48 hours pop-up
          io.to(userId).emit('popup', { message: `48 hours left for commitment: ${commitment.commitment}`, client: client.Mou_no });
        } else if (timeDiff <= 24 * 60 && timeDiff > 2 * 60) {
          // Show 24 hours pop-up
          io.to(userId).emit('popup', { message: `24 hours left for commitment: ${commitment.commitment}`, client: client.Mou_no });
        } else if (timeDiff <= 2 * 60 && timeDiff > 1 * 60) {
          // Show 2 hours pop-up
          io.to(userId).emit('popup', { message: `2 hours left for commitment: ${commitment.commitment}`, client: client.Mou_no });
        } else if (timeDiff <= 1 * 60) {
          // Show 1 hour pop-up
          io.to(userId).emit('popup', { message: `1 hour left for commitment: ${commitment.commitment}`, client: client.Mou_no });
        }
      }
    });

    // Check Critical Highlights
    client.CriticalHighlights.forEach((highlight) => {
      if (highlight.status === 'not catered') {
        const timeDiff = moment(highlight.expiryDate).diff(moment(), 'minutes');
        if (timeDiff <= 48 * 60 && timeDiff > 24 * 60) {
          // Show 48 hours pop-up
          io.to(userId).emit('popup', { message: `48 hours left for Critical Highlight: ${highlight.criticalHighlight}`, client: client.Mou_no });
        } else if (timeDiff <= 24 * 60 && timeDiff > 2 * 60) {
          // Show 24 hours pop-up
          io.to(userId).emit('popup', { message: `24 hours left for Critical Highlight: ${highlight.criticalHighlight}`, client: client.Mou_no });
        } else if (timeDiff <= 2 * 60 && timeDiff > 1 * 60) {
          // Show 2 hours pop-up
          io.to(userId).emit('popup', { message: `2 hours left for Critical Highlight: ${highlight.criticalHighlight}`, client: client.Mou_no });
        } else if (timeDiff <= 1 * 60) {
          // Show 1 hour pop-up
          io.to(userId).emit('popup', { message: `1 hour left for Critical Highlight: ${highlight.criticalHighlight}`, client: client.Mou_no });
        }
      }
    });
  });
};

// Function to send post-expiry popups
const sendPostExpiryPopups = async (io, userId) => {
  // Get the logged-in user
  const user = await UserModel.findById(userId);

  if (!user) {
    console.error('User not found!');
    return;
  }

  // If user is admin, show popups for all clients, else show only relevant ones
  const clients = user.role === 'admin' ? await AllClientsModel.find() : await AllClientsModel.find({ CSS: user.name });

  clients.forEach((client) => {
    // Check commitments after expiry
    client.Commitments.forEach((commitment) => {
      if (commitment.status === 'not done') {
        io.to(userId).emit('popup', { message: `Post-expiry: Commitment "${commitment.commitment}" is still pending`, client: client.Mou_no });
      }
    });

    // Check Critical Highlights after expiry
    client.CriticalHighlights.forEach((highlight) => {
      if (highlight.status === 'not catered') {
        io.to(userId).emit('popup', { message: `Post-expiry: Critical Highlight "${highlight.criticalHighlight}" is still pending`, client: client.Mou_no });
      }
    });
  });
};

// Check and send pop-ups every minute
const startPopupJob = (io) => {
    setInterval(() => {
      io.allSockets().then((clients) => {
        clients.forEach((clientId) => {
          // Send popups to each user
          checkAndSendPopups(io, clientId);
          sendPostExpiryPopups(io, clientId);
        });
      }).catch((error) => {
        console.error('Error getting clients:', error);
      });
    }, 60000); // Every minute
  };
  

export { startPopupJob };
