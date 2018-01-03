var abi = *interface*];

function create(*params*callback) {   
  return web3.eth.contract(abi).new(*params*
   {
     from: web3.eth.accounts[0],
     data: *bytecode*,
     gas: 4000000
   }, callback);
}

module.exports = {
  abi: abi,
  create: create
};
