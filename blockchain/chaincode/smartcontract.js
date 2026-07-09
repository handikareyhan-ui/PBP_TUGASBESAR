const { Contract } = require('fabric-contract-api');

class BansosChainContract extends Contract {
  
  _getTxTimestampString(ctx) {
    const timestamp = ctx.stub.getTxTimestamp();
    const seconds = timestamp.seconds.low || timestamp.seconds;
    const nanos = timestamp.nanos || 0;
    const milliseconds = (seconds * 1000) + (nanos / 1000000);
    return new Date(milliseconds).toISOString();
  }

  async InitLedger(ctx) {
    console.log('BansosChain smart contract initialized.');
    const timestamp = this._getTxTimestampString(ctx);
    await this.createAuditLog(ctx, 'INIT_LEDGER', '0x0000000000000000', 'Smart Contract initialized', timestamp);
  }

  /**
   * Create general system audit logs on-chain
   */
  async createAuditLog(ctx, id, txHash, aktivitas, timestamp) {
    const auditLog = {
      id,
      docType: 'auditLog',
      txHash,
      aktivitas,
      timestamp
    };
    await ctx.stub.putState(id, Buffer.from(JSON.stringify(auditLog)));
    return JSON.stringify(auditLog);
  }

  /**
   * Create ZKP verification outcomes on-chain immediately after verification completes
   */
  async createVerification(ctx, id, recipientId, proofHash, proofVerified, verifiedAt, status) {
    const verification = {
      id,
      docType: 'verification',
      recipientId,
      proofHash,
      proofVerified: proofVerified === 'true' || proofVerified === true || proofVerified === 1 || proofVerified === '1',
      verifiedAt,
      status
    };
    await ctx.stub.putState(id, Buffer.from(JSON.stringify(verification)));
    return JSON.stringify(verification);
  }

  /**
   * Create disbursement records on-chain
   */
  async createDistribution(ctx, id, recipientId, nominal, status, createdAt) {
    const distribution = {
      id,
      docType: 'distribution',
      recipientId,
      nominal: parseFloat(nominal),
      status,
      createdAt
    };
    await ctx.stub.putState(id, Buffer.from(JSON.stringify(distribution)));
    return JSON.stringify(distribution);
  }

  /**
   * Get a single audit log by ID
   */
  async getAuditLogById(ctx, id) {
    const assetJSON = await ctx.stub.getState(id);
    if (!assetJSON || assetJSON.length === 0) {
      throw new Error(`Audit log ${id} does not exist`);
    }
    return assetJSON.toString();
  }

  /**
   * Rich query to get all audit logs from CouchDB
   */
  async getAllAuditLogs(ctx) {
    const query = {
      selector: {
        docType: 'auditLog'
      }
    };
    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    const results = [];
    let result = await iterator.next();
    while (!result.done) {
      const strVal = Buffer.from(result.value.value.toString()).toString('utf8');
      try {
        results.push(JSON.parse(strVal));
      } catch (err) {
        results.push(strVal);
      }
      result = await iterator.next();
    }
    return JSON.stringify(results);
  }

  /**
   * Query the complete history of changes for a specific key (recipient, verification, or distribution)
   */
  async getHistory(ctx, assetId) {
    const iterator = await ctx.stub.getHistoryForKey(assetId);
    const results = [];
    let result = await iterator.next();
    while (!result.done) {
      const strVal = Buffer.from(result.value.value.toString()).toString('utf8');
      const histRecord = {
        txId: result.value.txId,
        timestamp: result.value.timestamp,
        isDelete: result.value.isDelete
      };
      try {
        histRecord.value = JSON.parse(strVal);
      } catch (err) {
        histRecord.value = strVal;
      }
      results.push(histRecord);
      result = await iterator.next();
    }
    return JSON.stringify(results);
  }
}

module.exports = BansosChainContract;
