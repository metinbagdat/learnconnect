import { Schema, model, Document } from 'mongoose';

interface IUser extends Document {
    email: string;
    name: string;
    provider: 'google' | 'apple';
    providerId: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    provider: { type: String, enum: ['google', 'apple'], required: true },
    providerId: { type: String, required: true },
}, {
    timestamps: true,
});

const User = model<IUser>('User', userSchema);

export default User;