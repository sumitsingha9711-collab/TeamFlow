import mongoose from 'mongoose';
export const connectDatabase = (uri) => mongoose.connect(uri);
export const disconnectDatabase = () => mongoose.disconnect();
