import express from "express";
import dotenv from "dotenv";
dotenv.config();
import {Server} from "socket.io"
import { createServer } from "node:http";
import cors from "cors";
const app = express();
import apiRouter from './routes/index';
const PORT=process.env.PORT ||3000;

const server= createServer(app)
const io=new Server(server,{
  cors:{
    origin:'*',
    methods:['GET','POST']
  }
})
io.on('connection',()=>{
  console.log("a user connected");
  
})
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use('/api', apiRouter);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});