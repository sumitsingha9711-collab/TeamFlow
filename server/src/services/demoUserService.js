import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

export async function seedDemoUser(config) {
  if (config.isProduction || !config.demoUser.enabled) return;

  await User.findOneAndUpdate(
    { email: config.demoUser.email },
    {
      $set: {
        name: config.demoUser.name,
        passwordHash: await bcrypt.hash(config.demoUser.password, 12),
      },
      $setOnInsert: { email: config.demoUser.email },
    },
    { upsert: true, new: true, runValidators: true },
  );
}
