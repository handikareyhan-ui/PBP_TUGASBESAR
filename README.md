# BansosChain Accountability System

BansosChain is a decentralized accountability system for distributing social assistance (Bansos) using Zero-Knowledge Proofs (ZKP) and Hyperledger Fabric.

## Project Structure

- **Backend**: API server built with Express.js, Prisma ORM, and SnarkJS for ZKP validation.
- **Frontend**: Portal interface built with React, Vite, and Tailwind CSS.
- **blockchain**: Hyperledger Fabric configuration, channel setups, and smart contracts (chaincode).

## Database Migration Details

The off-chain database is powered by **MongoDB** using Prisma ORM. (A legacy SQLite database was temporarily used during early development stages but has been fully decommissioned and permanently removed).

### MongoDB Setup

Since Prisma ORM utilizes transactions for database updates in MongoDB, MongoDB **must** be run as a replica set.

Refer to the [INSTALLATION.md](file:///d:/03_File%20Reyhan/TUGAS%20BESAR%20KELOMPOK%208%20BANSOS%20CHAIN/INSTALLATION.md) file for setup and execution instructions.
