const { baseAmount } = require("@xchainjs/xchain-util");
const BTC_Client = require("@xchainjs/xchain-bitcoin");

module.exports = class BitcoinClient {
  constructor(address) {
    this.network = "testnet";
    this.address = address;
    this.client = new BTC_Client.Client({ network: this.network });
  }

  /**
   * @returns {number}
   */
  async getBalance() {
    const balances = await this.client.getBalance(this.address);
    let balance = 0;
    balances.forEach((b) => {
      balance += b.amount.amount().toNumber();
    });

    return balance;
  }

  /**
   * @param {string} address
   * @param {number} amount
   * @param {number} [feeRate]
   */
  async buildTx(address, amount, feeRate = 1) {
    return BTC_Client.buildTx({
      amount: baseAmount(amount, 8),
      sender: this.address,
      recipient: address,
      feeRate,
      sochainUrl: this.client.sochainUrl,
      network: this.network,
      fetchTxHex: true, // IMPORTANT!
    });
  }

  /**
   * @description Broadcast signed tx
   * @param {string} txHex
   * @returns {string} txid
   */
  async broadcastTx(txHex) {
    return BTC_Client.broadcastTx({
      network: this.network,
      blockstreamUrl: this.client.blockstreamUrl,
      txHex,
    });
  }
};
