// @/models/WaterLevel.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWaterLevel extends Document {
  serial: string;
  waterLevel: number;
  distance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const WaterLevelSchema: Schema<IWaterLevel> = new Schema<IWaterLevel>(
  {
    serial: {
      type: String,
    },
    waterLevel: {
      type: Number,
    },
    distance: {
      type: Number,
    },
  },
  { timestamps: true },
);

export const WaterLevel: Model<IWaterLevel> =
  mongoose.models.WaterLevel ||
  mongoose.model<IWaterLevel>("WaterLevel", WaterLevelSchema);
