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
      required: true,
      trim: true,
      index: true,
    },
    namaWadah: {
      type: String,
      required: true,
      trim: true,
    },
    kedalaman: {
      type: Number,
      required: true,
      min: 0,
    },
    jarakSensorDasar: {
      type: Number,
      required: true,
      min: 0,
    },
    batasIsiMulai: {
      type: Number,
      required: true,
      min: 0,
    },
    batasIsiBerhenti: {
      type: Number,
      required: true,
      min: 0,
    },
    batasBuangMulai: {
      type: Number,
      required: true,
      min: 0,
    },
    batasBuangBerhenti: {
      type: Number,
      required: true,
      min: 0,
    },
    modeAuto: {
      type: Boolean,
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

PoolSchema.index({ userId: 1, serial: 1 }, { unique: true });

export const Pool: Model<IPool> =
  mongoose.models.Pool || mongoose.model<IPool>('Pool', PoolSchema);
