var help = require('./helper.js');

var tokenSale, avtToken, multisig;
var txValue = 1000;

describe("The multisig wallet", function() {
    this.timeout = function() { return 5000 };

    before(function(done) {
        help.setup(function(ts, at, ms) {
            tokenSale = ts;
            avtToken = at;
            multisig = ms;

            help.send('evm_increaseTime', [100000], function(err, result) {
                help.send('evm_mine', done);
            });
        });
    });

    // Checking variable initialisation and associated errors

    it("should have set the owners", function() {
        assert.equal(multisig.getOwners().toString(), OWNERS);
    });

    it("should have set the required confirmations", function() {
        assert.equal(multisig.required(), REQUIRED);
    });

    it("should not be created if required confirms > owners", function(done) {
        var owners = [web3.eth.accounts[1], web3.eth.accounts[2]];

        help.eth.multisigwallet.create(owners, 3, function(error, ms) {
            assert.equal(error, help.errorMessage);

            done();
        });
    });

    it("should not be created if required confirms is zero", function(done) {
        var owners = [web3.eth.accounts[1], web3.eth.accounts[2]];

        help.eth.multisigwallet.create(owners, 0, function(error, ms) {
            assert.equal(error, help.errorMessage);

            done();
        });
    });

    it("should not be created if any owner is the address 0", function(done) {
        var owners = [web3.eth.accounts[1], 0];

        help.eth.multisigwallet.create(owners, 1, function(error, ms) {
            assert.equal(error, help.errorMessage);

            done();
        });
    });

    // Checking transaction creation, confirmation and execution

    it("should let an owner submit a transaction", function(done) {
        
        multisig.submitTransaction(
            AVENTUS, 
            txValue, 
            '', 
            { gas: 300000 }, 
            function(error, res) {
                assert.equal(multisig.confirmations(0, web3.eth.accounts[0]), true);
                assert.equal(multisig.transactions(0)[0], AVENTUS);
                assert.equal(multisig.transactions(0)[1], txValue);
                assert.equal(multisig.transactions(0)[2], '0x');
                assert.equal(multisig.transactions(0)[3], false);

                done();
            }
        );
    });

    it("should not let anyone else submit a transaction", function(done) {
        multisig.submitTransaction(
            AVENTUS, 
            50, 
            '', 
            { gas: 300000, from: web3.eth.accounts[5] }, 
            function(error, res) {
                assert.equal(error, help.errorMessage);

                done();
            }
        );
    });

    it("should not add a transaction if destination is 0", function(done) {
        multisig.submitTransaction(
            0, 
            500, 
            '', 
            { gas: 300000 }, 
            function(error, res) {
                assert.equal(error, help.errorMessage);

                done();
            }
        );
    });

    it("should let an owner confirm a transaction", function(done) {
        multisig.confirmTransaction(
            0, 
            { gas: 300000, from: web3.eth.accounts[1] }, 
            function(error, res) {
                assert.equal(multisig.confirmations(0, web3.eth.accounts[1]), true);

                done();
            }
        );
    });

    it("should not confirm a transaction that doesn't exist", function(done) {
        multisig.confirmTransaction(
            2, 
            { gas: 300000, from: web3.eth.accounts[1] }, 
            function(error, res) {
                assert.equal(error, help.errorMessage);

                done();
            }
        );
    });

    it("should let an owner revoke a confirm on non-exec tx", function(done) {
        multisig.revokeConfirmation(
            0, 
            { gas: 300000, from: web3.eth.accounts[1] }, 
            function(error, res) {
                assert.equal(error, null);
                assert.equal(multisig.confirmations(0, web3.eth.accounts[1]), false);

                done();
            }
        );
    });

    it("should not exec a tx if < majority owners have confirmed", function(done) {
        multisig.confirmTransaction(
            0, 
            { gas: 300000, from: web3.eth.accounts[1] }, 
            function(error, res) {
                assert.equal(error, null);
                assert.equal(multisig.transactions(0)[3], false);

                done();
            }
        );
    });

    it("should exec a tx if majority owners have confirmed", function(done) {
        var toSend = 50000;

        web3.eth.sendTransaction(
            { to: multisig.address, value: toSend, gas: 300000 },
            function(e1) {
                multisig.confirmTransaction(
                    0, 
                    { gas: 300000, from: web3.eth.accounts[2] }, 
                    function(e2, res) {
                        assert.equal(e1, null);
                        assert.equal(e2, null);
                        assert.equal(multisig.transactions(0)[3], true);
                        assert.equal(
                            web3.eth.getBalance(multisig.address).toNumber(), 
                            toSend - txValue
                        );

                        done();
                    }
                );
            }
        );
    });

    // Checking web3 getter functions

    it("should correctly get number of confirmations", function() {
        assert.equal(multisig.getConfirmationCount(0), 3);
    });

    it("should correctly get confirmation addresses", function() {
        var confirmers = [
            web3.eth.accounts[0], 
            web3.eth.accounts[1], 
            web3.eth.accounts[2]
        ].toString();

        assert.equal(multisig.getConfirmations(0).toString(), confirmers);
    });

    it("should correctly get filtered transaction count", function() {
        assert.equal(multisig.getTransactionCount(false, true), 1);
    });

    it("should correctly get filtered transaction ids in range", function() {
        assert.equal(multisig.getTransactionIds(0, 1, true, false)[0], 0);
    });
});
