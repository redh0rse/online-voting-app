import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IVote extends Document {
  pollId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  candidateId: string; // This will store the candidate's _id
  ipAddress: string;
  deviceInfo: string;
  timestamp: Date;
}

const VoteSchema = new Schema<IVote>(
  {
    pollId: { type: Schema.Types.ObjectId, ref: 'Poll', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    candidateId: { type: String, required: true },
    ipAddress: { type: String, required: true },
    deviceInfo: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Create a compound index to ensure a user can only vote once per poll
VoteSchema.index({ pollId: 1, userId: 1 }, { unique: true });

// Check if the model already exists to prevent model overwrite error during hot reloading
const Vote = (mongoose.models.Vote as Model<IVote>) ||
  mongoose.model<IVote>('Vote', VoteSchema);

export default Vote; 