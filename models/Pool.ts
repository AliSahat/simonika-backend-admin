// @/models/Pool.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPool extends Document {
  userId: mongoose.Types.ObjectId;
  serial: string;
  namaWadah: string;
  kedalaman: number;
  keranTutup: number;
  keranNormal: number;
  keranBuka: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const PoolSchema: Schema<IPool> = new Schema<IPool>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serial: {
      type: String,
    },
    namaWadah: {
      type: String,
      required: true,
      trim: true,
    },
    kedalaman: {
      type: Number,
      required: true,
    },
    keranTutup: {
      type: Number,
      required: true,
    },
    keranNormal: {
      type: Number,
      required: true,
    },
    keranBuka: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Pool: Model<IPool> = mongoose.models.Pool || mongoose.model<IPool>('Pool', PoolSchema);
