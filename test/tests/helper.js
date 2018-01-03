assert = require('chai').assert,
web3 = setupWeb3();

PRIV = web3.eth.accounts[1];
AVENTUS = web3.eth.accounts[2];
OWNERS = [
    web3.eth.accounts[0], 
    web3.eth.accounts[1], 
    web3.eth.accounts[2], 
    web3.eth.accounts[3], 
    web3.eth.accounts[4]
];
REQUIRED = 3;

module.exports = {
    eth: require('../../build/'),
    send: send,
    setup: setup,
    saleData: saleData,
    errorMessage: "Error: VM Exception while processing transaction: invalid opcode"
};

function setup(fn) {
    module.exports.eth.multisigwallet.create(
        OWNERS, 
        REQUIRED, 
        function(e, multisig) {
            if (multisig.address) {
                var privstarttime = web3.eth.getBlock('latest').timestamp;
                var pubstartTime = privstarttime + 3600;

                module.exports.eth.tokensale.create(
                    PRIV, 
                    AVENTUS, 
                    multisig.address, 
                    pubstartTime, 
                    privstarttime,
                    function(e, tokenSale) {
                        if (tokenSale.address) {
                            var event = tokenSale.TokenAddress();
                            event.watch(function(error, e) {
                                event.stopWatching();

                                var avtToken = web3
                                    .eth
                                    .contract(module.exports.eth.avttoken.abi)
                                    .at(e.args._token);

                                
                                fn(tokenSale, avtToken, multisig);
                            });

                            tokenSale.setupAVT({ 
                                gas: 3000000 ,
                                from: AVENTUS
                            });
                        }
                    }
                );
            }
    });
};

function setupWeb3() {
    var Web3 = require('web3');
    var web3 = 
    new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    
    web3.eth.defaultAccount = web3.eth.accounts[0];

    return web3
}

function send(method, params, fn) {
    if (typeof params === 'function') {
        fn = params;
        params = [];
    }

    web3.currentProvider.sendAsync({
        jsonrpc: "2.0",
        method: method,
        params: params || [],
        id: new Date().getTime()
    }, fn);
}

// Setup Amounts
function saleData(tokenSale) {
    return {
        crowdTotAlloc: tokenSale.ALLOC_CROWDSALE(),
        privMaxAlloc: tokenSale.PRIV_ALLOC_MAX(),
        privRate: tokenSale.PRICE_PRIV(),
        baseRate: tokenSale.PRICE_BASE()
    };
}