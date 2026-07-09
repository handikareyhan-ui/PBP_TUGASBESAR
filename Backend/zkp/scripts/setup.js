const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Target directory paths
const BASE_DIR = path.resolve(__dirname, '..');
const KEYS_DIR = path.join(BASE_DIR, 'keys');
const CIRCUITS_DIR = path.join(BASE_DIR, 'circuits');
const INPUTS_DIR = path.join(BASE_DIR, 'inputs');
const PROOFS_DIR = path.join(BASE_DIR, 'proofs');

// Working directory is Backend root
const CWD = path.resolve(__dirname, '../..');

function runCmd(cmd, cwd = process.cwd()) {
  console.log(`Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd });
}

async function main() {
  console.log('--- Starting ZKP Compilation & Trusted Setup Ceremony ---');

  // Create required directories
  [KEYS_DIR, INPUTS_DIR, PROOFS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // 1. Compile Circom Circuit
  console.log('\n[1/6] Compiling Circom circuit...');
  const circuitPath = path.relative(CWD, path.join(CIRCUITS_DIR, 'eligibility.circom'));
  
  // Run circom
  runCmd(`circom "${circuitPath}" --r1cs --wasm --sym`, CWD);

  // Handle compiler differences (JS compiler vs Rust compiler)
  // JS legacy compiler outputs directly to current directory
  // Rust compiler (v2) outputs to current directory but structure differs
  const localR1cs = path.join(CWD, 'eligibility.r1cs');
  const localSym = path.join(CWD, 'eligibility.sym');
  const localWasm = path.join(CWD, 'eligibility.wasm');
  const localWasmDir = path.join(CWD, 'eligibility_js');

  const destR1cs = path.join(KEYS_DIR, 'eligibility.r1cs');
  const destSym = path.join(KEYS_DIR, 'eligibility.sym');
  const destWasm = path.join(KEYS_DIR, 'eligibility.wasm');

  // Move R1CS
  if (fs.existsSync(localR1cs)) {
    console.log(`Moving R1CS to keys/ directory: ${localR1cs} -> ${destR1cs}`);
    fs.renameSync(localR1cs, destR1cs);
  }

  // Move SYM
  if (fs.existsSync(localSym)) {
    console.log(`Moving SYM to keys/ directory: ${localSym} -> ${destSym}`);
    fs.renameSync(localSym, destSym);
  }

  // Move WASM
  if (fs.existsSync(localWasm)) {
    console.log(`Moving WASM to keys/ directory: ${localWasm} -> ${destWasm}`);
    fs.renameSync(localWasm, destWasm);
  } else if (fs.existsSync(localWasmDir)) {
    const wasmInDir = path.join(localWasmDir, 'eligibility.wasm');
    if (fs.existsSync(wasmInDir)) {
      console.log(`Moving WASM from directory: ${wasmInDir} -> ${destWasm}`);
      fs.copyFileSync(wasmInDir, destWasm);
      // Clean up local_js directory
      fs.rmSync(localWasmDir, { recursive: true, force: true });
    }
  }

  if (!fs.existsSync(destR1cs) || !fs.existsSync(destWasm)) {
    throw new Error('Failed to locate compiled eligibility.r1cs or eligibility.wasm files.');
  }

  console.log('\nCircuit compiled successfully and moved to keys/.');

  // 2. Start Powers of Tau Ceremony
  console.log('\n[2/6] Starting Powers of Tau ceremony...');
  const pot0 = path.join(KEYS_DIR, 'pot12_0000.ptau');
  const pot1 = path.join(KEYS_DIR, 'pot12_0001.ptau');
  const potFinal = path.join(KEYS_DIR, 'pot12_final.ptau');

  runCmd(`npx snarkjs powersoftau new bn128 12 "${pot0}" -v`);
  runCmd(`npx snarkjs powersoftau contribute "${pot0}" "${pot1}" --name="BansosChain Contributor 1" -v -e="some random entropy for bansoschain"`);
  runCmd(`npx snarkjs powersoftau prepare phase2 "${pot1}" "${potFinal}" -v`);

  // 3. Perform Groth16 Setup
  console.log('\n[3/6] Performing Groth16 trusted setup...');
  const zkey0 = path.join(KEYS_DIR, 'eligibility_0000.zkey');
  const zkeyFinal = path.join(KEYS_DIR, 'eligibility.zkey');

  runCmd(`npx snarkjs groth16 setup "${destR1cs}" "${potFinal}" "${zkey0}"`);

  // 4. Contribute to zkey
  console.log('\n[4/6] Contributing to zkey phase 2...');
  runCmd(`npx snarkjs zkey contribute "${zkey0}" "${zkeyFinal}" --name="BansosChain Contributor 2" -v -e="another random entropy for security"`);

  // 5. Export verification key
  console.log('\n[5/6] Exporting verification_key.json...');
  const vkeyPath = path.join(KEYS_DIR, 'verification_key.json');
  runCmd(`npx snarkjs zkey export verificationkey "${zkeyFinal}" "${vkeyPath}"`);

  // 6. Cleanup large intermediate ceremony files
  console.log('\n[6/6] Cleaning up large temporary setup files...');
  const filesToCleanup = [pot0, pot1, potFinal, zkey0, destR1cs, destSym];
  filesToCleanup.forEach((file) => {
    if (fs.existsSync(file)) {
      console.log(`Deleting: ${file}`);
      fs.unlinkSync(file);
    }
  });

  console.log('\n--- ZKP Setup Ceremony Completed Successfully! ---');
  console.log(`Generated Artifacts under ${KEYS_DIR}:`);
  console.log(`- eligibility.wasm (Wasm prover)`);
  console.log(`- eligibility.zkey (Groth16 proving key)`);
  console.log(`- verification_key.json (Groth16 verification key)`);
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
