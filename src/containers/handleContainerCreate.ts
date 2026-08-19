import Docker from "dockerode";
import path from "path";
import { DOMAIN, PROJECTS_HOST_ROOT } from "../config/serverConfig";

const docker = new Docker();



const TRAEFIK_NETWORK = "protodev";


// ============================================================
// LIST CONTAINERS
// ============================================================

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


// ============================================================
// CREATE SANDBOX CONTAINER
// ============================================================

export const handleContainerCreate = async (
    projectId: string
): Promise<
    {
        container: Docker.Container;
        port: string|undefined;
    } | undefined
> => {

    console.log(
        "Project id received for container create:",
        projectId
    );

    try {

        // =====================================================
        // 1. FIND EXISTING CONTAINER
        // =====================================================

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


        // =====================================================
        // 2. PROJECT PATH
        // =====================================================

        const hostProjectPath =
            path.join(
                PROJECTS_HOST_ROOT,
                projectId
            );


        console.log(
            "Linux host project path:",
            hostProjectPath
        );


        // =====================================================
        // 3. PREVIEW DOMAIN
        // =====================================================

        const previewHost =
            `${projectId}.${DOMAIN}`;


        console.log(
            "Preview hostname:",
            previewHost
        );


        // =====================================================
        // 4. CREATE SANDBOX
        // =====================================================

        console.log(
            "Creating sandbox container..."
        );


        const container =
            await docker.createContainer({

                // -------------------------------------------------
                // Image
                // -------------------------------------------------

                Image: "sandbox",


                // -------------------------------------------------
                // Container name
                // -------------------------------------------------

                name: projectId,


                // -------------------------------------------------
                // Terminal
                // -------------------------------------------------

                AttachStdin: true,

                AttachStdout: true,

                AttachStderr: true,

                Tty: true,

                Cmd: ["/bin/bash"],


                // -------------------------------------------------
                // Sandbox user
                // -------------------------------------------------

                User: "sandbox",


                // -------------------------------------------------
                // Application directory
                // -------------------------------------------------

                Volumes: {

                    "/home/sandbox/app": {},

                },


                // -------------------------------------------------
                // Vite port
                // -------------------------------------------------

                ExposedPorts: {

                    "5173/tcp": {},

                },


                // -------------------------------------------------
                // Environment
                // -------------------------------------------------

                Env: [

                    "HOST=0.0.0.0",

                    "CHOKIDAR_USEPOLLING=true",

                    "CHOKIDAR_INTERVAL=500",

                ],


                // =================================================
                // TRAEFIK LABELS
                // =================================================
Labels: {
    // Enable Traefik
    "traefik.enable": "true",

    // Docker network
    "traefik.docker.network": TRAEFIK_NETWORK,

    // Router
    [`traefik.http.routers.${projectId}.rule`]:
        `Host(\`${previewHost}\`)`,

    [`traefik.http.routers.${projectId}.entrypoints`]:
        "web",

    // Middleware
    [`traefik.http.routers.${projectId}.middlewares`]:
        `${projectId}-fixhost`,

    // Service
    [`traefik.http.services.${projectId}.loadbalancer.server.port`]:
        "5173",

    // Rewrite Host before sending request to Vite
    [`traefik.http.middlewares.${projectId}-fixhost.headers.customrequestheaders.Host`]:
        "localhost",
},


                // =================================================
                // HOST CONFIG
                // =================================================

                HostConfig: {

                    // ---------------------------------------------
                    // Bind project directory
                    // ---------------------------------------------

                    Binds: [

                        `${hostProjectPath}:/home/sandbox/app`,

                    ],


                    // ---------------------------------------------
                    // Join Traefik network
                    // ---------------------------------------------

                    NetworkMode:
                        TRAEFIK_NETWORK,

                },

            });


        console.log(
            "Container created:",
            container.id
        );


        // =====================================================
        // 5. START CONTAINER
        // =====================================================

        await container.start();


        console.log(
            "Sandbox container started:",
            projectId
        );


        // =====================================================
        // 6. INSPECT
        // =====================================================

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


        // =====================================================
        // 7. RETURN
        // =====================================================
        //
        // IMPORTANT:
        //
        // terminalApp.ts currently expects:
        //
        // result.container
        // result.port
        //
        // Traefik does NOT use a random host port anymore.
        //
        // Therefore port is undefined.
        //
        // -----------------------------------------------------

        return {

            container,

            port: undefined,

        };

    } catch (error) {

        console.error(
            "Error while creating sandbox container:",
            error
        );

        return undefined;
    }
};


// ============================================================
// GET CONTAINER
// ============================================================

export const getContainer = async (
    containerName: string
): Promise<
    Docker.Container | undefined
> => {

    try {

        const containers =
            await docker.listContainers({

                all: true,

                filters: {

                    name: [
                        containerName,
                    ],

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

                    name: [
                        containerName,
                    ],

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
                .getContainer(
                    container.Id
                )
                .inspect();


        const portInfo =
            containerInfo
                .NetworkSettings
                ?.Ports
                ?.["5173/tcp"];


        if (
            !portInfo ||
            portInfo.length === 0
        ) {

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