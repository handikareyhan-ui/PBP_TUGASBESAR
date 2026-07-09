const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = path.resolve(__dirname, '../..');
const BLOCKCHAIN_DIR = path.join(WORKSPACE_DIR, 'blockchain');
const ORGANIZATIONS_DIR = path.join(BLOCKCHAIN_DIR, 'organizations');
const TEMP_ORGANIZATIONS_DIR = path.join(BLOCKCHAIN_DIR, 'temp-organizations');
const CHANNEL_ARTIFACTS_DIR = path.join(BLOCKCHAIN_DIR, 'channel-artifacts');

function runCmd(cmd) {
  console.log(`Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

async function main() {
  console.log('=== Bootstrapping Fabric Cryptography & Channel Genesis Block ===');

  // Create channel artifacts directory if not exists
  if (!fs.existsSync(CHANNEL_ARTIFACTS_DIR)) {
    console.log(`Creating channel-artifacts directory: ${CHANNEL_ARTIFACTS_DIR}`);
    fs.mkdirSync(CHANNEL_ARTIFACTS_DIR, { recursive: true });
  }

  // Clear existing directories to avoid conflicts
  if (fs.existsSync(ORGANIZATIONS_DIR)) {
    console.log('Removing old organizations directory...');
    fs.rmSync(ORGANIZATIONS_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(TEMP_ORGANIZATIONS_DIR)) {
    console.log('Removing old temp-organizations directory...');
    fs.rmSync(TEMP_ORGANIZATIONS_DIR, { recursive: true, force: true });
  }

  // Convert Windows backslashes to forward slashes for Docker volume mapping
  const cleanBlockchainPath = BLOCKCHAIN_DIR.replace(/\\/g, '/');
  const volumeMount = `${cleanBlockchainPath}:/opt/gopath/src/github.com/hyperledger/fabric/peer`;

  console.log('\n[1/2] Generating Cryptographic Certificates (cryptogen)...');
  // Output cryptogen results to temp-organizations to avoid WSL2 mount locks on Windows host
  const cryptogenCmd = `docker run --rm -v "${volumeMount}" hyperledger/fabric-tools:2.5.4 cryptogen generate --config=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config.yaml --output=/opt/gopath/src/github.com/hyperledger/fabric/peer/temp-organizations`;
  runCmd(cryptogenCmd);

  // Rename temp-organizations to organizations on host
  if (fs.existsSync(TEMP_ORGANIZATIONS_DIR)) {
    console.log('Moving generated certificates to organizations directory...');
    fs.renameSync(TEMP_ORGANIZATIONS_DIR, ORGANIZATIONS_DIR);
  } else {
    throw new Error('Cryptogen failed to generate certificates in temp-organizations');
  }

  console.log('\n[2/2] Generating Channel Genesis Block (configtxgen)...');
  const configtxgenCmd = `docker run --rm -v "${volumeMount}" hyperledger/fabric-tools:2.5.4 configtxgen -profile TwoOrgsChannel -configPath /opt/gopath/src/github.com/hyperledger/fabric/peer -channelID bansoschannel -outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/genesis.block`;
  runCmd(configtxgenCmd);

  console.log('\n=== Bootstrapping Completed Successfully! ===');
  console.log(`Generated folders:`);
  console.log(`- ${ORGANIZATIONS_DIR}`);
  console.log(`- ${CHANNEL_ARTIFACTS_DIR}/genesis.block`);
}

main().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
