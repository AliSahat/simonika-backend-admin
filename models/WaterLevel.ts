// @/models/WaterLevel.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import { WATER_CONTROL_STATES, type WaterControlState } from "@/lib/waterControl";

export interface IWaterLevel extends Document {
  serial: string;
  poolId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  waterLevel: number;
  distance: number;
  timestamp?: number;
  uptimeMs?: number;
  sequence?: number;
  sensorValid: boolean;
  fillValveOpen: boolean;
  drainValveOpen: boolean;
  controlState: WaterControlState;
  createdAt?: Date;
  updatedAt?: Date;
}

const WaterLevelSchema: Schema<IWaterLevel> = new Schema<IWaterLevel>(
  {
    serial: {
      type: String,
      required: true,
      index: true,
    },
    poolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pool",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    waterLevel: {
      type: Number,
    },
    distance: {
      type: Number,
    },
    timestamp: {
      type: Number,
    },
    uptimeMs: {
      type: Number,
    },
    sequence: {
      type: Number,
    },
    sensorValid: {
      type: Boolean,
      required: true,
    },
    fillValveOpen: {
      type: Boolean,
      required: true,
    },
    drainValveOpen: {
      type: Boolean,
      required: true,
    },
    controlState: {
      type: String,
      enum: WATER_CONTROL_STATES,
      required: true,
    },
  },
  { timestamps: true },
);

WaterLevelSchema.index({ poolId: 1, createdAt: -1 });

export const WaterLevel: Model<IWaterLevel> =
  mongoose.models.WaterLevel ||
  mongoose.model<IWaterLevel>("WaterLevel", WaterLevelSchema);
