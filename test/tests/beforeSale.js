var help = require('./helper');

var tokenSale, avtToken, multisig, saleData;

describe("Before the public sale interval", function() {
    this.timeout = function() { return 6000 };

    before(function(done) {
        help.setup(function(ts, at, ms) {
            tokenSale = ts;
            avtToken = at;
            multisig = ms;

           	saleData = help.saleData(tokenSale);

            done();
        });
    });

    it("should have set the start time", function() {
        assert.notEqual(tokenSale.publicStartTime(), 0);
    });

    it("should have set the private start time", function() {
        assert.notEqual(tokenSale.privateStartTime(), 0);
    });

    it("should have set the end time", function() {
        assert.notEqual(tokenSale.publicEndTime(), 0);
    });

    it("should heave set the PRIV Account", function() {
        assert.equal(tokenSale.privAddress(), PRIV);
    });
    
    it("should have set the Aventus account", function() {
        assert.equal(tokenSale.aventusAddress(), AVENTUS);
    });

    it("should have set the multisig account", function() {
        assert.equal(tokenSale.multisigAddress(), multisig.address);
    });

    it("should have set up avtToken balances", function() {
        var aventusBal = tokenSale.ALLOC_LIQUID().toNumber();
        var aventusIlliquidBal = tokenSale.ALLOC_ILLIQUID().toNumber();

        var bal = avtToken.balanceOf(AVENTUS).toNumber();
        var illiquidBal = avtToken.illiquidBalanceOf(AVENTUS).toNumber();
        var supply = avtToken.totalSupply().toNumber();

        assert.equal(aventusBal, bal);
        assert.equal(aventusIlliquidBal, illiquidBal);
        assert.equal(aventusBal + aventusIlliquidBal, supply);
    });

    it("should error if buying AVT", function(done) {
        web3.eth.sendTransaction({
            to: tokenSale.address, 
            from: web3.eth.accounts[4], 
            value: web3.toWei(1, 'ether')
        }, function(error) {
            assert.equal(error, help.errorMessage);
            done();
        });
    });

    it("should allow PRIV to pre buy", function(done) {
        tokenSale.preBuy({ 
            value: web3.toWei(1, 'ether'), 
            from: PRIV,
            gas: 300000
        }, function(error) {
            assert.equal(error, null);
            assert.equal(
                avtToken.balanceOf(PRIV).toNumber(), 
                saleData.privRate.toNumber()
            );
            assert.equal(
                tokenSale.etherRaised().toNumber(), 
                web3.toWei(1, 'ether')
            );
            assert.equal(
                tokenSale.avtSold().toNumber(), 
                saleData.privRate.toNumber()
            );

            done();
        });
    });

    it("should not allow non PRIV accounts to pre buy AVT", function(done) {
        tokenSale.preBuy(
        { 
            value: web3.toWei(1, 'ether'), 
            gas: 300000 
        }, function(error) {
            assert.equal(error, help.errorMessage);
            done();
        });
    });

    it("should not allow token transfers", function(done) {
        avtToken.transfer(
            web3.eth.accounts[0], 
            10, 
            { from: PRIV }, 
            function(error) {
                assert.equal(error, help.errorMessage);
                done();
            }
        );
    });

    it("should not allow PRIV to buy more than their cap", function(done) {
        var max = saleData.privMaxAlloc / saleData.privRate;

        tokenSale.preBuy({ 
            value: web3.toWei(max, 'ether'), 
            from: PRIV,
            gas: 300000
        }, function(error) {
            assert.equal(error, help.errorMessage);

            done();
        });
    });

    afterEach("token sale contract should never have any ether", function() {
        assert.equal(web3.eth.getBalance(tokenSale.address), 0);
    });
});
