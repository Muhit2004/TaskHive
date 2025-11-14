import mongoose from "mongoose";

export const connection = () => {
  mongoose
    .connect(process.env.MONGO_URL, {
      dbName: "MERN_AUTHENTICATION",
    })
    .then(() => {
      console.log("Database Connected");
    })
    .catch((err) => {
      console.log(`Some error occurred while connecting to database ${err}`);
    });
};
