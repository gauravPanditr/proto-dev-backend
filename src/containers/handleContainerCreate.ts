import Docker from "dockerode";


const docker=new Docker();

export const handleContainerCreate=async(projectId:string)=>{
    console.log(projectId);
   try {
    const container=await docker.createContainer({
        Image:'sandbox',
        AttachStderr:true,
        AttachStdout:true,
        AttachStdin:true,
        Cmd:['/bin/bash'],
        Tty:true,
        User:"sandbox",
        HostConfig:{
            Binds:[
                 `/projects/${projectId}:/home/sandbox/app`
            ],
              PortBindings: {
                    "5173/tcp": [
                        {
                            "HostPort": "0" // random port will be assigned by docker
                        }
                    ]
                },
                ExtraHosts:{
                    "5173/tcp":{}
                },
                
        },
        Env:["HOST=0.0.0.0"]
    }) 
    console.log("Container Created",container.id);
    await container.start();
    console.log("Container Started");
    
    
   } catch (error) {
    console.log(error);
    
   }
    
}