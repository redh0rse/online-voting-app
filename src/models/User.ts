import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email: string;
  image?: string;
  emailVerified?: Date;
  mobile?: string;
  dob?: string;
  voterId?: string;
  faceEmbedding?: number[];
  hasVoted: boolean;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  registrationComplete: boolean;
}

const UserSchema = new Schema<IUser>({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  image: { type: String },
  emailVerified: { type: Date },
  mobile: { type: String },
  dob: { type: String },
  voterId: { type: String, unique: true, sparse: true },
  faceEmbedding: { type: [Number] },
  hasVoted: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  registrationComplete: { type: Boolean, default: false },
}, { 
  timestamps: true 
});

// Calculate registrationComplete field before saving
UserSchema.pre('save', function(next) {
  // Check if all required fields are present
  if (
    this.name && 
    this.email && 
    this.mobile && 
    this.dob && 
    this.voterId && 
    this.faceEmbedding && 
    this.faceEmbedding.length > 0
  ) {
    this.registrationComplete = true;
  } else {
    this.registrationComplete = false;
  }
  next();
});

// Delete model if it exists to prevent OverwriteModelError
// during hot reloading in development
let User: Model<IUser>;

if (mongoose.models && 'users' in mongoose.models) {
  User = mongoose.models.users as Model<IUser>;
} else {
  User = mongoose.model<IUser>('users', UserSchema);
}

export default User; 