import express from "express";
import dotenv from "dotenv";
dotenv.config();
import {Server} from "socket.io"
import { createServer } from "node:http";
import chokidar from "chokidar"
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
  
});
const editorNameSpace=io.of('/editor')
editorNameSpace.on("connection",(socket)=>{
  console.log("editor connected");
  let project=123;
  if(project){
    var watcher=chokidar.watch(`/projects/${project}`,{
      ignored:(path)=>path.includes("node_modules"),
      persistent:true,
      awaitWriteFinish:{
        stabilityThreshold:2000

      },
      ignoreInitial:true
    });

    watcher.on("all",(event,path)=>{
      console.log(event,path);

      
    })
  }
  


  socket.on("message",async (data)=>{
    await watcher.close();
    console.log("got a message",data);
    
  })
})
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use('/api', apiRouter);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});