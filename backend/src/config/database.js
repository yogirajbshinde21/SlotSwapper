const mongoose = require('mongoose');


const connectDB = async() =>{
    try{
        // mongoose.connect returns a promise
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);

        // Also log the database for debugging
        console.log(`Database: ${conn.connection.name}`);

    } catch(err){
        console.log('MongoDB Connection Error');
        process.exit(1);
    }
};

module.exports = connectDB;