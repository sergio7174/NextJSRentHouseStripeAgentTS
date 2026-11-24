import mongoose from "mongoose";
import colors from "colors";

const connectDb = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI as string);
        console.log(`Mongodb connected successfully to: ${conn.connection.host}:27017`);
        console.log(`Mongodb connected successfully to: ${process.env.DATABASENAME}:27017`);
    } catch (error) {
        console.log(error);
    }
} 

export default connectDb;