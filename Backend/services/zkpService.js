const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ZkpService {
  constructor() {
    this.wasmPath = path.resolve(__dirname, '../zkp/keys/eligibility.wasm');
    this.zkeyPath = path.resolve(__dirname, '../zkp/keys/eligibility.zkey');
    this.vkeyPath = path.resolve(__dirname, '../zkp/keys/verification_key.json');
  }

  /**
   * Generates a proof hash representing the ZKP verification artifact.
   * 
   * @param {object} proof - The proof object
   * @returns {string} The SHA-256 hash of the proof
   */
  generateProofHash(proof) {
    const dataString = JSON.stringify(proof);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Generates witness and proof for citizen eligibility using Circom.
   * 
   * @param {number} pendapatanBulanan - Monthly income
   * @param {number} jumlahTanggungan - Number of dependents
   * @returns {Promise<object>} Object containing proof, publicSignals, and proofHash
   */
  async generateProof(pendapatanBulanan, jumlahTanggungan) {
    console.log(`[ZKP Service] Generating witness and proof for income=${pendapatanBulanan}, dependents=${jumlahTanggungan}...`);
    
    const inputs = {
      income: Math.floor(pendapatanBulanan),
      dependents: Math.floor(jumlahTanggungan),
      salt: Math.floor(Math.random() * 1000000000),
      incomeThreshold: 2000000,
      minDependents: 1
    };

    try {
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        inputs,
        this.wasmPath,
        this.zkeyPath
      );

      const proofHash = this.generateProofHash(proof);

      return {
        proof,
        publicSignals,
        proofHash
      };
    } catch (error) {
      console.error('[ZKP Service] Error generating proof:', error);
      throw error;
    }
  }

  /**
   * Verifies a Zero-Knowledge Proof using snarkjs verification key logic.
   * 
   * @param {object} proof - The proof object
   * @param {array} publicSignals - Public signals array
   * @returns {Promise<boolean>} True if verification succeeds
   */
  async verifyProof(proof, publicSignals) {
    console.log(`[ZKP Service] Verifying ZKP proof using verification key...`);
    try {
      const vKey = JSON.parse(fs.readFileSync(this.vkeyPath, 'utf8'));
      const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
      return isValid;
    } catch (error) {
      console.error('[ZKP Service] Error verifying proof:', error);
      return false;
    }
  }
}

module.exports = new ZkpService();
