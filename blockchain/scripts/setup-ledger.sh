#!/bin/bash
set -e

# Config paths
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt
ORDERER_ADMIN_TLS_CERT=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/users/Admin@example.com/tls/client.crt
ORDERER_ADMIN_TLS_KEY=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/users/Admin@example.com/tls/client.key
GENESIS_BLOCK=/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/genesis.block

echo "=== Packaging Chaincode (CCaaS) ==="
if [ ! -f /opt/gopath/src/github.com/hyperledger/fabric/peer/bansoschain.tar.gz ]; then
  rm -rf /tmp/ccaas
  mkdir -p /tmp/ccaas
  cp /opt/gopath/src/github.com/hyperledger/fabric/peer/ccaas-package/connection.json /tmp/ccaas/connection.json
  cd /tmp/ccaas
  tar -czf code.tar.gz connection.json
  cp /opt/gopath/src/github.com/hyperledger/fabric/peer/ccaas-package/metadata.json /tmp/ccaas/metadata.json
  tar -czf /opt/gopath/src/github.com/hyperledger/fabric/peer/bansoschain.tar.gz metadata.json code.tar.gz
  rm -rf /tmp/ccaas
  cd /opt/gopath/src/github.com/hyperledger/fabric/peer
else
  echo "bansoschain.tar.gz already exists, skipping dynamic packaging."
fi

# Function to set environment variables for peers
setGlobals() {
  ORG=$1
  PEER=$2
  if [ $ORG -eq 1 ]; then
    CORE_PEER_LOCALMSPID="Org1MSP"
    CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/peers/peer${PEER}.org1.example.com/tls/ca.crt
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    if [ $PEER -eq 1 ]; then
      CORE_PEER_ADDRESS=peer1.org1.example.com:7051
    else
      CORE_PEER_ADDRESS=peer2.org1.example.com:8051
    fi
  else
    CORE_PEER_LOCALMSPID="Org2MSP"
    CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.example.com/peers/peer${PEER}.org2.example.com/tls/ca.crt
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
    if [ $PEER -eq 1 ]; then
      CORE_PEER_ADDRESS=peer1.org2.example.com:9051
    else
      CORE_PEER_ADDRESS=peer2.org2.example.com:10051
    fi
  fi
}

echo "=== Joining Orderers to Channel (Channel Participation) ==="
echo "Joining orderer1.example.com:7053..."
osnadmin channel join --channelID bansoschannel --config-block $GENESIS_BLOCK -o orderer1.example.com:7053 --ca-file $ORDERER_CA --client-cert $ORDERER_ADMIN_TLS_CERT --client-key $ORDERER_ADMIN_TLS_KEY || true

echo "Joining orderer2.example.com:7053..."
osnadmin channel join --channelID bansoschannel --config-block $GENESIS_BLOCK -o orderer2.example.com:7053 --ca-file $ORDERER_CA --client-cert $ORDERER_ADMIN_TLS_CERT --client-key $ORDERER_ADMIN_TLS_KEY || true

echo "Joining orderer3.example.com:7053..."
osnadmin channel join --channelID bansoschannel --config-block $GENESIS_BLOCK -o orderer3.example.com:7053 --ca-file $ORDERER_CA --client-cert $ORDERER_ADMIN_TLS_CERT --client-key $ORDERER_ADMIN_TLS_KEY || true

echo "=== Joining Peers ==="
# Org1 Peer1
setGlobals 1 1
peer channel join -b $GENESIS_BLOCK || true

# Org1 Peer2
setGlobals 1 2
peer channel join -b $GENESIS_BLOCK || true

# Org2 Peer1
setGlobals 2 1
peer channel join -b $GENESIS_BLOCK || true

# Org2 Peer2
setGlobals 2 2
peer channel join -b $GENESIS_BLOCK || true

echo "=== Installing Chaincode ==="
# Org1 Peer1
setGlobals 1 1
peer lifecycle chaincode install bansoschain.tar.gz

# Org1 Peer2
setGlobals 1 2
peer lifecycle chaincode install bansoschain.tar.gz

# Org2 Peer1
setGlobals 2 1
peer lifecycle chaincode install bansoschain.tar.gz

# Org2 Peer2
setGlobals 2 2
peer lifecycle chaincode install bansoschain.tar.gz

# Find package ID
setGlobals 1 1
peer lifecycle chaincode calculatepackageid bansoschain.tar.gz > pkgid.txt
CC_PACKAGE_ID=$(cat pkgid.txt)
echo "Chaincode Package ID: $CC_PACKAGE_ID"

echo "=== Approving Chaincode ==="
# Org 1 Approve
setGlobals 1 1
peer lifecycle chaincode approveformyorg -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com --channelID bansoschannel --name bansoschain --version 1.0 --package-id $CC_PACKAGE_ID --sequence 1 --tls --cafile $ORDERER_CA

# Org 2 Approve
setGlobals 2 1
peer lifecycle chaincode approveformyorg -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com --channelID bansoschannel --name bansoschain --version 1.0 --package-id $CC_PACKAGE_ID --sequence 1 --tls --cafile $ORDERER_CA

echo "=== Committing Chaincode ==="
peer lifecycle chaincode commit -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com --channelID bansoschannel --name bansoschain --version 1.0 --sequence 1 --tls --cafile $ORDERER_CA --peerAddresses peer1.org1.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt --peerAddresses peer1.org2.example.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt

echo "=== Initializing Ledger ==="
peer chaincode invoke -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com --channelID bansoschannel --name bansoschain --tls --cafile $ORDERER_CA --peerAddresses peer1.org1.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt --peerAddresses peer1.org2.example.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt -c '{"Args":["InitLedger"]}'

echo "=== Ledger Setup Completed successfully! ==="
