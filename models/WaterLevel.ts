import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWaterLevel extends Document {
  serial: string;
  waterLevel: number;
  distance: number;
  timestamp?: number;
  uptimeMs?: number;
  sequence?: number;
  fillValveOpen?: boolean;
  drainValveOpen?: boolean;
  controlState?: "IDLE" | "FILLING" | "DRAINING" | "MANUAL" | "FAULT";
  sensorValid?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const WaterLevelSchema: Schema<IWaterLevel> = new Schema<IWaterLevel>(
  {
    serial: { type: String, required: true, index: true },
    waterLevel: { type: Number },
    distance: { type: Number },
    timestamp: { type: Number },
    uptimeMs: { type: Number },
    sequence: { type: Number },
    fillValveOpen: { type: Boolean },
    drainValveOpen: { type: Boolean },
    controlState: {
      type: String,
      enum: ["IDLE", "FILLING", "DRAINING", "MANUAL", "FAULT"],
    },
    sensorValid: { type: Boolean },
  },
  { timestamps: true },
);

WaterLevelSchema.index({ serial: 1, createdAt: -1 });

export const WaterLevel: Model<IWaterLevel> =
  mongoose.models.WaterLevel ||
  mongoose.model<IWaterLevel>("WaterLevel", WaterLevelSchema);
