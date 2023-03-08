let Web3 = require('web3')

let web3 = new Web3(new Web3.providers.HttpProvider('https://speedy-nodes-nyc.moralis.io/c70e9f92f8532081e2d9325e/bsc/testnet'))

module.exports = web3