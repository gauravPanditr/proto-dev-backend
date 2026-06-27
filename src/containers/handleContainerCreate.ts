import Docker from "dockerode";

const docker = new Docker();

export const listContainer = async (): Promise<void> => {
    try {
        const containers = await docker.listContainers();

        console.log("Containers:", containers);

        containers.forEach((containerInfo) => {
            console.log("Ports:", containerInfo.Ports);
        });
    } catch (error) {
        console.error("Error listing containers:", error);
    }
};

export const handleContainerCreate = async (
    projectId: string
): Promise<{ container: Docker.Container; port: string } | undefined> => {
    console.log(
        "Project id received for container create:",
        projectId
    );

    try {
        const existingContainers = await docker.listContainers({
            all: true,
            filters: {
                name: [projectId],
            },
        });

        console.log("Existing containers:", existingContainers);

        const existingContainer = existingContainers.at(0);

        if (existingContainer) {
            console.log(
                "Container already exists, removing it..."
            );

            const oldContainer = docker.getContainer(
                existingContainer.Id
            );

            await oldContainer.remove({
                force: true,
            });
        }

        console.log("Creating new container...");

        const container = await docker.createContainer({
            Image: "sandbox",
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Cmd: ["/bin/bash"],
            name: projectId,
            Tty: true,
            User: "sandbox",

            Volumes: {
                "/home/sandbox/app": {},
            },

            ExposedPorts: {
                "5173/tcp": {},
            },

            Env: ["HOST=0.0.0.0"],

            HostConfig: {
                Binds: [
                    `${process.cwd()}/projects/${projectId}:/home/sandbox/app`,
                ],

                PortBindings: {
                    "5173/tcp": [
                        {
                            HostPort: "0", // Docker assigns a random free port
                        },
                    ],
                },
            },
        });

        console.log("Container created:", container.id);

       await container.start();
    console.log("Container started");

    // ✅ Inspect AFTER start to get the real port
    const info = await container.inspect();
    const portInfo = info.NetworkSettings?.Ports?.["5173/tcp"];

    if (!portInfo || portInfo.length === 0) {
        console.error("Port binding not found after start");
        return undefined;
    }

    const port = portInfo[0]?.HostPort;
    
    console.log("Container port:", port);
if (!port) {
    console.error("Host port is undefined");
    return undefined;
}
    return { container, port }; 
    } catch (error) {
        console.error(
            "Error while creating container:",
            error
        );

        return undefined;
    }
};

export const getContainerPort = async (
    containerName: string
): Promise<string | undefined> => {
    try {
        const containers = await docker.listContainers({
            all: true,
            filters: {
                name: [containerName],
            },
        });

        const container = containers.at(0);

        if (!container) {
            console.log("Container not found");
            return undefined;
        }

        const containerInfo = await docker
            .getContainer(container.Id)
            .inspect();

        const portInfo =
            containerInfo.NetworkSettings?.Ports?.["5173/tcp"];

        if (!portInfo || portInfo.length === 0) {
            console.log("Port mapping not found");
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