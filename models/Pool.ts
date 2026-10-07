// @/models/Pool.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPool extends Document {
  userId: mongoose.Types.ObjectId;
  serial: string;
  namaWadah: string;
  kedalaman: number;
  jarakSensorDasar: number;
  batasIsiMulai: number;
  batasIsiBerhenti: number;
  batasBuangMulai: number;
  batasBuangBerhenti: number;
  modeAuto: boolean;
  isActive: boolean;
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
      required: true,
      trim: true,
      lowercase: true,
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
    jarakSensorDasar: {
      type: Number,
      required: true,
    },
    batasIsiMulai: {
      type: Number,
      required: true,
    },
    batasIsiBerhenti: {
      type: Number,
      required: true,
    },
    batasBuangMulai: {
      type: Number,
      required: true,
    },
    batasBuangBerhenti: {
      type: Number,
      required: true,
    },
    modeAuto: {
      type: Boolean,
      required: true,
      default: true,
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

// Serial is a device identity, so it cannot be claimed by another user either.
PoolSchema.index({ serial: 1 }, { unique: true, name: 'unique_device_serial' });

export const Pool: Model<IPool> = mongoose.models.Pool || mongoose.model<IPool>('Pool', PoolSchema);
