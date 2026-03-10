# Use a heavy Debian-based Node image because we need to compile Go and run Python/Perl
FROM node:20-bullseye

# Install system dependencies for the security tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python-is-python3 \
    perl \
    wget \
    git \
    golang && \
    rm -rf /var/lib/apt/lists/*

# Setup Go environment for ProjectDiscovery tools
ENV GOPATH=/root/go
ENV PATH=$PATH:/root/go/bin

# 1. Install Subfinder & Nuclei
RUN go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest && \
    go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

# 2. Install SQLMap
RUN git clone --depth 1 https://github.com/sqlmapproject/sqlmap.git /opt/sqlmap && \
    ln -s /opt/sqlmap/sqlmap.py /usr/local/bin/sqlmap

# 3. Install Nikto
RUN git clone --depth 1 https://github.com/sullo/nikto.git /opt/nikto && \
    ln -s /opt/nikto/program/nikto.pl /usr/local/bin/nikto

# 4. Install XSStrike
RUN git clone --depth 1 https://github.com/s0md3v/XSStrike.git /opt/xsstrike && \
    pip3 install -r /opt/xsstrike/requirements.txt --break-system-packages && \
    echo '#!/bin/bash\npython3 /opt/xsstrike/xsstrike.py "$@"' > /usr/local/bin/xsstrike && \
    chmod +x /usr/local/bin/xsstrike

# Create application directory
WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Generate Prisma Client (assuming SQLite is used for demo, ensuring DB is accessible)
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Expose port and start
EXPOSE 3000
CMD ["npm", "start"]
