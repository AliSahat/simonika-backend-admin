// @/models/WaterLevel.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWaterLevel extends Document {
  userId: mongoose.Types.ObjectId;
  serial: string;
  waterLevel: number;
  distance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const WaterLevelSchema: Schema<IWaterLevel> = new Schema<IWaterLevel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serial: {
      type: String,
      required: true,
    },
    waterLevel: {
      type: Number,
      required: true,
    },
    distance: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const WaterLevel: Model<IWaterLevel> = mongoose.models.WaterLevel || mongoose.model<IWaterLevel>('WaterLevel', WaterLevelSchema);
