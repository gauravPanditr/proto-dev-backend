import express from "express";
import dotenv from "dotenv";
dotenv.config();
import {Server} from "socket.io"
import { createServer } from "node:http";
import chokidar from "chokidar"

import cors from "cors"
const app = express();
import apiRouter from './routes/index';
import { handleEditorSocketEvents } from "./scoketHandler/editorHandler";


const PORT=process.env.PORT ||3000;

const server= createServer(app)
const io=new Server(server,{
  cors:{
    origin:'*',
    methods:['GET','POST']
  }
})
app.use(express.json());
app.use(express.urlencoded());
app.use(cors());
app.use('/api', apiRouter);
io.on('connection',()=>{
  console.log("a user connected");
  
});
const editorNameSpace=io.of('/editor')
editorNameSpace.on("connection",(socket)=>{
  console.log("editor connected");
 let projectId = socket.handshake.query['projectId'];

    console.log("Project id received after connection", projectId);
 console.log(projectId);
 
  if(projectId){
    var watcher=chokidar.watch(`/projects/${projectId}`,{
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
  handleEditorSocketEvents(socket,editorNameSpace);


  socket.on("message",async (data)=>{
    await watcher.close();
    console.log("got a message",data);
    
  })
})




server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

