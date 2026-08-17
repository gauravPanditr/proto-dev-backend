FROM ubuntu:20.04

# Create sandbox user
RUN useradd -ms /bin/bash sandbox

# Update packages
RUN apt-get update && apt-get upgrade -y

# Install tools
RUN apt-get install -y \
    nano \
    curl \
    git \
    ca-certificates

# Install Node.js 22
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

# Create application directory and give ownership
RUN mkdir -p /home/sandbox/app \
    && chown -R sandbox:sandbox /home/sandbox

# Configure prompt to show current directory
RUN echo "PS1='\w '" >> /home/sandbox/.bashrc

# Run as sandbox user
USER sandbox

# Default working directory
WORKDIR /home/sandbox/app

# Keep terminal interactive
CMD ["/bin/bash"]