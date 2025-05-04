// models/DailyClients.js
import mongoose from 'mongoose';

const DailyClientSchema = new mongoose.Schema({
  cssUser: { type: String, required: true },  // CSS user's name
  cycles: [
    {
      cycleNumber: { type: Number, required: true }, // Cycle number
      batches: [
        {
          batchDate: { type: Date, default: Date.now },  // Timestamp for each batch
          mous: [
            {
              mou: { type: String, required: true },
              customerName: { type: String, required: true },
              medium: {
                type: String,
                enum: ['Emailed', 'Called & Emailed', 'Emailed But Call No Response'],
                default: "Emailed",
                required: true,
                
              }
            }
          ]
        }
      ]
    }
  ]
});

const DailyClientsModel = mongoose.model('DailyClients', DailyClientSchema);
export default DailyClientsModel;
