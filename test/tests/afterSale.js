var help = require('./helper');

var tokenSale, avtToken;

describe("After the crowd sale interval", function() {
    this.timeout = function() { return 5000 };

    before(function(done) {
        help.setup(function(ts, at, ms) {
            tokenSale = ts;
            avtToken = at;
            
            tokenSale.preBuy({ 
                value: web3.toWei(1, 'ether') , 
                from: PRIV,
                gas: 300000
            }, function(error) {
                help.send('evm_increaseTime', [450000], function(err) {
                    help.send('evm_mine', done);
                });
            });
        });
    });

    it("should error and not create AVT if buying", function(done){     
        var balance = avtToken.balanceOf(web3.eth.accounts[4]);

        web3.eth.sendTransaction(
        	{
	            to: avtToken.address,
	            from: web3.eth.accounts[4],
	            gas: 300000,
	            value: web3.toWei(1, 'ether') 
        	},
            function(error) {
                var newBalance = avtToken.balanceOf(web3.eth.accounts[4]);
                
                assert.equal(error, help.errorMessage);
                assert.equal(balance.toNumber(), newBalance.toNumber());

                done();
            }
        );
    });

    it("should not allow PRIV to prebuy", function(done) {
        tokenSale.preBuy({ value: 100, from: PRIV }, function(error) {
            assert.equal(error, help.errorMessage);

            done();
        });
    });

    it("should allow tokens to be transferred", function(done) {        
        avtToken.transfer(
        	web3.eth.accounts[7], 
        	200, 
        	{ from: PRIV, gas: 300000 },
        	function(error) {
        		assert.equal(error, null);
        		assert.equal(avtToken.balanceOf(web3.eth.accounts[7]), 200);

        		done();
        	}
        );
    });
});
