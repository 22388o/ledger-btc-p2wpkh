const BTCLedgerApp = require("./src/ledger")
const BTC_Client = require("./src/client")

async function main () {
    // Connect ledger and obtain address
    const btcLedgerApp = new BTCLedgerApp()
    await btcLedgerApp.connect()
    const address = await btcLedgerApp.getAddress()

    // Create bitcoin client and build txn
    const client = new BTC_Client(address)
    const { psbt, inputs } = await client.buildTx("tb1qspw367wyyvepueeckl9yzmfttw2mw4exhceu9z", 19550000, 1)

    // Sign transaction
    const signedTx = await btcLedgerApp.signTransaction(psbt, inputs)

    // Broadcast tx
    const txid = await client.broadcastTx(signedTx)

    return txid
}

main().then(console.log).catch(console.log)
