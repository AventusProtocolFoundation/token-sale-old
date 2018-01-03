var help = require('./helper.js');

var tokenSale, avtToken, crowdsaleMax, baseRate;

describe("The regular interval", function() {
    this.timeout = function() { return 5000 };

    before(function(done) {
        help.setup(function(ts, at){
            tokenSale = ts;
            avtToken = at;
            saleData = help.saleData(tokenSale);

            help.send('evm_increaseTime', [4000], function(err, result) {
                help.send('evm_mine', done);
            });
        });
    });

    it('should not allow PRIV to prebuy during crowdsale', function(done) {
		tokenSale.preBuy({ value: 100, from: PRIV }, function(error) {
            assert.equal(error, help.errorMessage);

            done();
        });
    });

    it('should allow buyer to purchase AVT at the base rate', function(done) {
    	var avtToSell = saleData.crowdTotAlloc;
        var ethRaise = avtToSell / saleData.baseRate;

		web3.eth.sendTransaction(
            {
	            to: tokenSale.address,
	            from: web3.eth.accounts[5],
                value: web3.toWei(ethRaise, 'ether'),
                gas: 300000
	        },
            function(error) {
                assert.equal(error, null);
                assert.equal(
                    avtToken.balanceOf(web3.eth.accounts[5]).toNumber(), 
                    avtToSell.toNumber()
                );

                done();
            }
        );
    });

    it('should not allow > than 6,000,000 AVT to be created', function(done) {
		web3.eth.sendTransaction(
            {
                to: tokenSale.address, 
                from: web3.eth.accounts[6], 
                value: web3.toWei(500, 'ether')
            },
            function(error) {
                assert.equal(error, help.errorMessage);

                done();
            }
        );
    });

    it("should not allow tokens to be transferrable", function(done) {
        avtToken.transfer(
            web3.eth.accounts[0], 
            200, 
            { from: web3.eth.accounts[4] },
            function(error) {
                assert.equal(error, help.errorMessage);

                done();
            }
        );
    });

    afterEach("contract should never have any ether", function() {
        assert.equal(web3.eth.getBalance(tokenSale.address), 0);
    });
});