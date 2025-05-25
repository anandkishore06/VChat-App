import mongoose from "mongoose";

export const ConnectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Database Connected Sucessfully : ${conn.connection.host}`);

    }
    catch (err) {
        console.log("MongoDB Connection Error : ", err);

    }
}