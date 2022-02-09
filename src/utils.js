const { ECPairFactory } = require('ecpair')
const tinysecp = require('tiny-secp256k1');
const ECPairAPI = ECPairFactory(tinysecp); // last bitcoinlib package doesn't include ECPair

function compressPublicKey(pk) {
    const { publicKey } = ECPairAPI.fromPublicKey(Buffer.from(pk, 'hex'));
    return publicKey.toString('hex');
}

module.exports = {
    compressPublicKey
}