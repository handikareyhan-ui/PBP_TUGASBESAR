#!/bin/bash
set -e
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt

echo "=== Initializing Ledger ==="
peer chaincode invoke -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com --channelID bansoschannel --name bansoschain --tls --cafile $ORDERER_CA --peerAddresses peer1.org1.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt --peerAddresses peer1.org2.example.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt -c '{"Args":["InitLedger"]}'
echo "=== Ledger Initialized successfully ==="
