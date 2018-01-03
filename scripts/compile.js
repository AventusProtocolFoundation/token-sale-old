var solc = require('solc');
var fs = require('fs');
var paths = process.argv;

var input = {};
var output = {};

// Create Input to compiler
for (var i = 2; i < paths.length; i++) {
  var file = fs.readFileSync(paths[i], 'utf8');
  input[paths[i]] = file;

  if (i == paths.length - 1) {
    console.log("Compiling Contracts...");
    output = solc.compile({sources: input}, 1);
    
    for (var error in output.errors)
      console.log(output.errors[error]);
  }
}

// Format Output from compiler for web3
console.log("Generating Web3 creation function for contracts...");

for (var contract in output.contracts) {
  var c = output.contracts[contract];
  var abi = JSON.parse(c.interface);
  var params = "";

  for(var i = 0; i < abi.length; i++) {
    if(abi[i].type == "constructor")
      for (var j = 0; j < abi[i].inputs.length; j++)
        params += abi[i].inputs[j].name + ', ';
  }

  var filePath = '../scripts/template.js';
  var file = fs.readFileSync(filePath, 'utf8');

  file = file.split("*params*").join(params);
  file = file.replace("*interface*", c.interface.substring(0, c.interface.length - 1));
  file = file.replace("*bytecode*", "'" + c.bytecode + "'");

  var contractName = contract.split(':')[1].toLowerCase();
  fs.writeFileSync('../build/' + contractName + '.js', file, 'utf-8');
  fs.writeFileSync('../logs/' + contractName + '_gas_estimates.json', JSON.stringify(c.gasEstimates), 'utf-8');
}

// Create index.js for imports
var indexjs = "module.exports = {\n";
for (var contract in output.contracts) {
  var contractName = contract.split(':')[1].toLowerCase();
  indexjs += contractName + ": require(\"./" + contractName + ".js\"),\n";
}

fs.writeFileSync('../build/index.js', indexjs + '\n}', 'utf-8');

