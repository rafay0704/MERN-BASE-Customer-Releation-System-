import mongoose from 'mongoose';

const CriticalClientBatchSchema = new mongoose.Schema({
    cssUser: { type: String, required: true },
    cycles: [
        {
            cycleNumber: { type: Number, required: true },
            batches: [
                {
                    batchDate: { type: Date, default: Date.now },
                    mous: [
                        {
                            mou: { type: String, required: true },
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
}, { timestamps: true });

const CriticalClientBatchModel = mongoose.model('CriticalClientBatch', CriticalClientBatchSchema);

export default CriticalClientBatchModel;
