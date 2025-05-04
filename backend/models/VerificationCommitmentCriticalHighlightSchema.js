import mongoose from 'mongoose';

const VerificationCommitmentCriticalHighlightSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'AllClients', required: true },
  commitmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commitments' },
  criticalHighlightId: { type: mongoose.Schema.Types.ObjectId, ref: 'CriticalHighlights' },
  status: { type: String, required: true, enum: ['done', 'not done', 'catered', 'not catered'] },
  updateTimestamp: { type: Date, default: Date.now },
});

const VerificationCommitmentCriticalHighlight = mongoose.model('VerificationCommitmentCriticalHighlight', VerificationCommitmentCriticalHighlightSchema);

export default VerificationCommitmentCriticalHighlight;
