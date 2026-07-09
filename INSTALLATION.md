# BansosChain Installation and Startup Guide

This document outlines the step-by-step instructions to initialize and run the BansosChain system with MongoDB and Hyperledger Fabric.

---

## 1. Running MongoDB (Replica Set Setup)

Prisma ORM requires MongoDB transactions for queries like `upsert`. Therefore, you must start MongoDB as a single-node replica set.

### Option A: Via Docker (WSL2 or Native)
Run the following commands to launch MongoDB inside Docker:

```bash
# 1. Start MongoDB container with replica set parameter
docker run --name mongodb -d -p 27017:27017 mongo:latest --replSet rs0

# 2. Initialize the replica set using localhost:27017 to allow host-level resolving
docker exec -it mongodb mongosh --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: '127.0.0.1:27017' }] })"
```

### Option B: Local MongoDB Service
If you run MongoDB directly on Windows:
1. Edit your `mongod.cfg` and add the replica set config:
   ```yaml
   replication:
     replSetName: rs0
   ```
2. Restart the MongoDB Windows Service.
3. Open `mongosh` and run:
   ```javascript
   rs.initiate()
   ```

---

## 2. Running the Backend Server

1. Navigate to the backend folder:
   ```bash
   cd Backend
   ```
2. Configure environmental variables in `.env`:
   ```env
   PORT=3000
   DATABASE_URL="mongodb://localhost:27017/bansoschain"
   JWT_SECRET="bansoschain_super_secret_jwt_key_2026"
   ```
3. Sync Prisma Client and DB Indexes:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
4. Start backend development server:
   ```bash
   npm run dev
   ```

---

## 3. Running the Frontend Interface

1. Navigate to the frontend folder:
   ```bash
   cd Frontend
   ```
2. Verify environmental variables in `.env`:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Access the interface at `http://localhost:5173/`.

---

## 4. Running the Hyperledger Fabric Network

The BansosChain project runs a dedicated production Hyperledger Fabric network utilizing **Raft consensus** (3 orderers), **4 peers** with CouchDB state databases, and a **Node.js Chaincode-as-a-Service (CCaaS)** container.

### Step 1: Clean up any conflicting networks
If you have a conflicting test-network running, clean it up:
```bash
wsl -d Ubuntu docker rm -f cli network-peer0.org1.example.com-1 network-peer0.org2.example.com-1 network-peer1.org1.example.com-1 network-peer1.org2.example.com-1 network-orderer.example.com-1 network-couchdb0-1 network-couchdb1-1 network-couchdb2-1 network-couchdb3-1
```

### Step 2: Start the Fabric Network
From the root workspace directory, start the docker-compose services:
```bash
wsl -d Ubuntu docker-compose -f "/mnt/d/03_File Reyhan/TUGAS BESAR KELOMPOK 8 BANSOS CHAIN/blockchain/docker/docker-compose.yml" up -d
```

### Step 3: Initialize the Channel and Chaincode
Run the ledger initialization script in the CLI container to join the orderers, peers, install, approve, commit, and initialize the smart contract `bansoschain` on `bansoschannel`:
```bash
wsl -d Ubuntu docker exec docker_cli_1 bash ./scripts/setup-ledger.sh
```

### Step 4: Verify the Deployment
Verify that the channel and chaincode are successfully deployed:
```bash
# Verify channels
wsl -d Ubuntu docker exec docker_cli_1 peer channel list

# Verify committed chaincode
wsl -d Ubuntu docker exec docker_cli_1 peer lifecycle chaincode querycommitted -C bansoschannel
```
