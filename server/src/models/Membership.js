import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
  },
  {
    timestamps: true,
  },
);

membershipSchema.index(
  {
    workspaceId: 1,
    userId: 1,
  },
  {
    unique: true,
  },
);

export const Membership = mongoose.model('Membership', membershipSchema);
