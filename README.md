# Aventus - Blockchain Repo
Note all build and test scripts require `bash`. 

`MultisigWallet.sol` is a clone of Gnosis wallet, the only change: `pragma solidity 0.4.4;` => `pragma solidity ^0.4.4;`. Please confirm in the audit that this is safe.

## Build
Run `npm install` then `npm run build` which compiles everything in `src/` and adds each item to a web3 initialiser in `build/`.

## Test
Run `npm test` which will spin up an in memory blockchain using testrpc and run all tests in `test/` using mocha in the order specified in `test/test.js`

## Docs
All required documents are in the `docs/` directory. A link to a commentable version of these documents is on [Google Drive](https://drive.google.com/drive/folders/0B8TFoqO1KgY3TXBJTHFHZGE0Rk0?usp=sharing). This includes: the smart contract system detailed documentation, the bug bounty programme, and the roll out timeline.
