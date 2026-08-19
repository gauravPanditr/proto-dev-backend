import Docker from "dockerode";
import path from "path";
import { DOMAIN, PROJECTS_HOST_ROOT } from "../config/serverConfig";

const docker = new Docker();


const TRAEFIK_NETWORK = "protodev";




export const listContainer = async (): Promise<void> => {
    try {
        const containers = await docker.listContainers({
            all: true,
        });

        console.log("Containers:", containers);

        containers.forEach((containerInfo) => {
            console.log(
                "Container:",
                containerInfo.Names
            );

            console.log(
                "Ports:",
                containerInfo.Ports
            );
        });
    } catch (error) {
        console.error(
            "Error listing containers:",
            error
        );
    }
};




export const handleContainerCreate = async (
    projectId: string
): Promise<Docker.Container | undefined> => {

    console.log(
        "Project id received for container create:",
        projectId
    );

    try {

        

        const existingContainers =
            await docker.listContainers({
                all: true,
                filters: {
                    name: [projectId],
                },
            });

        console.log(
            "Existing containers:",
            existingContainers
        );

        const existingContainer =
            existingContainers.at(0);

        if (existingContainer) {

            console.log(
                "Container already exists, removing it..."
            );

            const oldContainer =
                docker.getContainer(
                    existingContainer.Id
                );

            await oldContainer.remove({
                force: true,
            });

            console.log(
                "Old container removed"
            );
        }



        const hostProjectPath = path.join(
            PROJECTS_HOST_ROOT,
            projectId
        );

        console.log(
            "Linux host project path:",
            hostProjectPath
        );



        const previewHost =
            `${projectId}.${DOMAIN}`;

        console.log(
            "Preview hostname:",
            previewHost
        );


       

        console.log(
            "Creating sandbox container..."
        );

        const container =
            await docker.createContainer({

                Image: "sandbox",

                name: projectId,

                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,

                Cmd: ["/bin/bash"],

                Tty: true,

                User: "sandbox",


               

                Volumes: {
                    "/home/sandbox/app": {},
                },


               

                ExposedPorts: {
                    "5173/tcp": {},
                },


             
                Env: [
                    "HOST=0.0.0.0",
                    "CHOKIDAR_USEPOLLING=true",
                    "CHOKIDAR_INTERVAL=500",
                ],



                Labels: {

                    "traefik.enable": "true",

                    "traefik.docker.network":
                        TRAEFIK_NETWORK,


                    // Router
                    [`traefik.http.routers.${projectId}.rule`]:
                        `Host(\`${previewHost}\`)`,

                    [`traefik.http.routers.${projectId}.entrypoints`]:
                        "web",


                    // Service
                    [`traefik.http.services.${projectId}.loadbalancer.server.port`]:
                        "5173",
                },


               

                HostConfig: {

                    // Bind project directory
                    Binds: [
                        `${hostProjectPath}:/home/sandbox/app`,
                    ],

                    // Connect to Traefik network
                    NetworkMode:
                        TRAEFIK_NETWORK,
                },
            });


        console.log(
            "Container created:",
            container.id
        );


      
        await container.start();

        console.log(
            "Sandbox container started:",
            projectId
        );



        const info =
            await container.inspect();

        console.log(
            "Container name:",
            info.Name
        );

        console.log(
            "Container status:",
            info.State?.Status
        );

        console.log(
            "Container networks:",
            Object.keys(
                info.NetworkSettings?.Networks || {}
            )
        );


        return container;

    } catch (error) {

        console.error(
            "Error while creating sandbox container:",
            error
        );

        return undefined;
    }
};




export const getContainer = async (
    containerName: string
): Promise<Docker.Container | undefined> => {

    try {

        const containers =
            await docker.listContainers({
                all: true,
                filters: {
                    name: [containerName],
                },
            });

        const container =
            containers.at(0);

        if (!container) {

            console.log(
                "Container not found:",
                containerName
            );

            return undefined;
        }

        return docker.getContainer(
            container.Id
        );

    } catch (error) {

        console.error(
            "Error getting container:",
            error
        );

        return undefined;
    }
};




export const getContainerPort = async (
    containerName: string
): Promise<string | undefined> => {

    try {

        const containers =
            await docker.listContainers({
                all: true,
                filters: {
                    name: [containerName],
                },
            });

        const container =
            containers.at(0);

        if (!container) {

            console.log(
                "Container not found:",
                containerName
            );

            return undefined;
        }


        const containerInfo =
            await docker
                .getContainer(container.Id)
                .inspect();


        const portInfo =
            containerInfo.NetworkSettings
                ?.Ports?.["5173/tcp"];


        if (!portInfo || portInfo.length === 0) {

            console.log(
                "No host port mapping found for 5173"
            );

            return undefined;
        }


        return portInfo[0]?.HostPort;

    } catch (error) {

        console.error(
            "Error while getting container port:",
            error
        );

        return undefined;
    }
};