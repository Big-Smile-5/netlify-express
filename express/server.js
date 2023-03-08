'use strict';
const express = require("express")
const cors = require("cors")
const crypto = require('crypto')
const bodyParser = require('body-parser')
const serverless = require('serverless-http')
const {
    AptosAccount,
    AptosClient,
    TransactionBuilderRemoteABI
} = require('aptos')

const app = express()
const path = __dirname + '/views/'

const router = express.Router()
 
app.use(cors())
app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(express.static(path))

const address = "0x3f3bff624734bc1310ee371b782798fd19280d91ec46c6495f2983c283fdd28a"
const privateKey = "18e9ad820d140b4c1f208039143b9bcb533960ef3442d39c48a26431c95d91a2"
const nodeURL = "https://testnet.aptoslabs.com"

const uint8Array = Buffer.from(privateKey, 'hex')
const account = new AptosAccount(uint8Array, address)
const aptosClient = new AptosClient(nodeURL)

const oddPercent = 49
const rewardPercent = 190
const maxNumber = 1000000
const gameHash = crypto.createHash('sha256').update(`${Date.now()}`).digest('hex')

const generateRandomNumber = () => {
    const timestamp = Date.now()
    const nonce = (Math.random() * maxNumber).toFixed(0)
    let resultHash = crypto.createHash('sha256').update(gameHash + '_' + timestamp + '_' + nonce).digest('hex')
    resultHash = resultHash.substring(0, 10)
    
    return parseInt(resultHash, 16) % maxNumber
}

const transfer = async (to, amount) => {
    const builder = new TransactionBuilderRemoteABI(aptosClient, {
        sender: account.address()
    })
    const rawTx = await builder.build(
        '0x1::coin::transfer',
        ['0x1::aptos_coin::AptosCoin'],
        [ to, amount ]
    )
    const expirationTimestamp = Math.floor(Date.now() / 1000) + 100
    rawTx.expiration_timestamp_secs = BigInt(expirationTimestamp)
    const siginedTx = await aptosClient.signTransaction(account, rawTx)
    const tx = await aptosClient.submitTransaction(siginedTx)

    return tx.hash
}

router.post('/flips', async function (req, res) {
    console.log(req.body)

    const wallet = req.body.wallet
    const amount = req.body.amount
    const betSide = req.body.betSide
    const transactionId = req.body.transactionId

    try {
        const tx = await aptosClient.getTransactionByHash(transactionId)
        const args = tx.payload?.arguments
        if (args[0] == account.address() && args[1] == amount) {
            const rdn = generateRandomNumber()
            const leftEnd = maxNumber * (oddPercent / 100)
            const rightStart = maxNumber - leftEnd
            const result = (rdn <= leftEnd) ? 'HEAD' : ((rdn >= rightStart) ? 'TAIL' : 'NONE')
            console.log(result)
            if (result == betSide) {
                const rewardAmount = (parseInt(amount) * rewardPercent / 100).toFixed(0)
                const txHash = await transfer(wallet, rewardAmount)
                res.status(200).json({
                    result,
                    txHash,
                    rewardAmount,
                    state: 0,
                    message: 'You won!'
                })
            }
            else {
                res.status(200).json({
                    result,
                    state: 1,
                    message: 'You lose!'
                })
            }
        } else {
            res.status(400).json({
                state: 2,
                message: 'Invalid request!'
            })
        }
    } catch (e) {
        console.log(e.message)
        res.status(400).json({
            state: 2,
            message: "Bad request!"
        })
    }
})

app.use('/.netlify/functions/server', router);

app.get('*', function (req, res) {
    res.sendFile(path + 'index.html')
})

module.exports = app;
module.exports.handler = serverless(app);