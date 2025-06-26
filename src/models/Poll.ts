import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICandidate {
  _id: mongoose.Types.ObjectId;
  name: string;
  party: string;
  symbol: string; // URL or path to the candidate's party symbol image
}

export interface IPoll extends Document {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  candidates: ICandidate[];
  totalVotes: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema({
  name: { type: String, required: true },
  party: { type: String, required: true },
  symbol: { type: String, required: true },
});

const PollSchema = new Schema<IPoll>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    candidates: { type: [CandidateSchema], required: true },
    totalVotes: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Check if the model already exists to prevent model overwrite error during hot reloading
const Poll = (mongoose.models.Poll as Model<IPoll>) ||
  mongoose.model<IPoll>('Poll', PollSchema);

export default Poll; 