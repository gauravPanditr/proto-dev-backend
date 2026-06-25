
import express from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express();
import apiRouter from './routes/index';
const PORT=process.env.PORT ||3000;


app.use('/api', apiRouter);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});