const BitcoinApp = require("@ledgerhq/hw-app-btc").default;
const TransportHID = require("@ledgerhq/hw-transport-node-hid").default;
const BitcoinLib = require("bitcoinjs-lib");
const { compressPublicKey } = require("./utils");

module.exports = class BitcoinLedger {
  constructor() {
    this.transport = null;
    this.btcApp = null;
    this.derivationPath = "84'/1'/0'/0/0"; // TESTNET
  }

  async connect() {
    if (!(await TransportHID.isSupported())) {
      throw new Error("Ledger not supported");
    }
    this.transport = await TransportHID.create();
    this.btcApp = new BitcoinApp(this.transport);
  }

  /**
   * @returns {string} Bitcoin address
   */
  async getAddress() {
    if (!this.btcApp) {
      throw new Error("Please connect ledger");
    }

    if (!this.transport) {
      this.transport = await TransportHID.create();
    }

    const { publicKey } = await this.btcApp.getWalletPublicKey(
      this.derivationPath,
      { format: "p2sh" }
    );
    const pubkey = Buffer.from(compressPublicKey(publicKey), "hex");
    const { address } = BitcoinLib.payments.p2wpkh({
      pubkey,
      network: BitcoinLib.networks.testnet,
    });

    if (!address) {
      throw Error("Invalid address");
    }

    return address;
  }

  /**
   * @param {BitcoinLib.Psbt} psbt
   * @param {import('@xchainjs/xchain-bitcoin').UTXO[]} utxo
   * @returns {string} Return signed tx ready to broadcast
   */
  async signTransaction(psbt, utxo) {
    if (!this.btcApp) {
      throw new Error("Please connect ledger");
    }

    if (!this.transport) {
      this.transport = await TransportHID.create();
    }

    const inputs = utxo.map((item) => {
      const utxoTx = BitcoinLib.Transaction.fromHex(item.txHex);
      const splitedTx = this.btcApp.splitTransaction(
        utxoTx.toHex(),
        utxoTx.hasWitnesses()
      );
      return [splitedTx, item.index];
    });

    const newTxHex = psbt.data.globalMap.unsignedTx.toBuffer().toString("hex");
    const splitNewTx = this.btcApp.splitTransaction(newTxHex, true);
    const outputScriptHex = this.btcApp
      .serializeTransactionOutputs(splitNewTx)
      .toString("hex");

    const signedTx = await this.btcApp.createPaymentTransactionNew({
      inputs,
      associatedKeysets: inputs.map(() => this.derivationPath),
      outputScriptHex,
      segwit: true,
      useTrustedInputForSegwit: true,
      additionals: ["bech32"],
    });

    return signedTx;
  }
};
