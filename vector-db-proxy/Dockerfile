FROM rust:latest
# Create working directory
RUN mkdir -p /usr/local/src/vector-db-proxy
ARG workdir=/usr/local/src/vector-db-proxy
#Set working directory
WORKDIR ${workdir}

RUN apt-get update && \
    apt-get install -y cmake

#Copy source code to image
COPY . $workdir
#COPY src/publish_to_pubsub.rs ${workdir}
COPY Cargo.toml .
#Install cmake
# Build release application
RUN #cargo build --release
RUN cargo build
#Expose port
EXPOSE 8001
#Run app
CMD ["target/debug/vector-db-proxy"]