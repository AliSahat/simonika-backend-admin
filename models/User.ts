// @/moodels/User.js
import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export interface IUser extends Document {
  name: string;
  username: string;
  password?: string;
  email?: string;
  googleId?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserModel extends Model<IUser> {}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    password: {
      type: String,
      required: false,
      minlength: 6,
      select: false,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
    },
    googleId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (!this.password) return next();
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) {
    throw new Error('Password not selected. Use .select("+password") to compare.');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

const User: IUserModel = (mongoose.models.User as IUserModel) || mongoose.model<IUser, IUserModel>('User', userSchema);
export default User;
