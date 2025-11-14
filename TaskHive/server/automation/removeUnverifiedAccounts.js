import cron from "node-cron";
import { User } from "../models/userModels.js";

export const removeUnverifiedAccounts = () => {
  cron.schedule("*/30 * * * *", async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const userToDelete = await User.deleteMany({
      accountVerified: false,
      createdAt: { $lt: thirtyMinutesAgo },
    });
  });
};
