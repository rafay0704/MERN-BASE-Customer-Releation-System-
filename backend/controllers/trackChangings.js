import AllClientsModel from '../models/AllClients.js';

/**
 * Record changes in the client's document.
 * 
 * @param {string} clientId - The client's ID (Mou_no).
 * @param {object} oldData - The old data of the client.
 * @param {object} newData - The new data of the client.
 * @param {string} userName - The name of the user making the changes.
 */
export const trackChanges = async (clientId, oldData, newData, userName) => {
  try {
    // Find the client by Mou_no
    const client = await AllClientsModel.findOne({ Mou_no: clientId });

    if (!client) {
      console.error(`Client with ID ${clientId} not found for tracking changes.`);
      return;
    }

    const changes = [];
    for (const key in newData) {
      if (newData.hasOwnProperty(key) && !key.startsWith('_')) {
        if (JSON.stringify(newData[key]) !== JSON.stringify(oldData[key])) {
          changes.push({
            changings: `Field ${key} changed from ${oldData[key]} to ${newData[key]}`,
            name: userName,
            timestamp: new Date()
          });
        }
      }
    }

    if (changes.length > 0) {
      await AllClientsModel.findOneAndUpdate(
        { Mou_no: clientId },
        { $push: { ChangingsTrack: { $each: changes } } },
        { new: true }
      );
    }
  } catch (error) {
    console.error('Error tracking changes:', error);
  }
};
