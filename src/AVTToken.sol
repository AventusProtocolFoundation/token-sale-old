pragma solidity ^0.4.11;

import 'ERC20.sol';

/// AVTToken contract using ERC-20 token standard
contract AVTToken is ERC20 {
    // Time after end date that illiquid AVT can be transferred
    uint public constant ILLIQUID_PERIOD = 1 years;
    // Time after which no more tokens can be created (in seconds)
    uint public endMintingTime; 
    // Address of the contract which may mint new tokens
    address public minter;

    uint public supply;
    mapping (address => uint) public balances;
    mapping (address => uint) public illiquidBalances;
    mapping (address => mapping (address => uint)) public allowed;

    // Checks if _from has sufficient funds
    modifier hasFunds(address _from, uint _value) { 
        assert(balances[_from] >= _value); 
        _; 
    }
    // Asserts msg.sender has allowed to transfer from acccount _from
    modifier hasAllowance(address _from, uint _value) { 
        assert(_value <= allowed[_from][msg.sender]);
        _;
    }
    // Checks if minter is calling the function
    modifier onlyMinter {
        assert (msg.sender == minter);
        _;
    }
    // Checks currently in the minting interval
    modifier isMintable {
        assert(now < endMintingTime);
        _;
    }
    // Checks currently after the minting interval
    modifier isTransferable {
        assert(now >= endMintingTime);
        _;
    }
    // Checks is illiquid tokens are liquid
    modifier isLiquid {
        assert(now >= endMintingTime + ILLIQUID_PERIOD);
        _;
    }

    /** Initializes contract
     *  @param _endMintingTime Interval for minting (in seconds)
     */
    function AVTToken(uint _endMintingTime) {
        minter = msg.sender;
        endMintingTime = _endMintingTime;
    }

    /** Get the balance of the account with address _owner 
     *  @param _owner Address of owner
     *  @return balance Balance of owning address
     */
    function balanceOf(address _owner) constant returns (uint) {
        return balances[_owner];
    }

    /** Get the total token supply
     *  @return totalSupply
     */
    function totalSupply() constant returns (uint) {
        return supply;
    }

    /** Get the illiquid balance of the account with address _owner 
     *  @param _owner Address of owner
     *  @return balance Illiquid alance of owning address
     */
    function illiquidBalanceOf(address _owner) constant returns (uint) {
        return illiquidBalances[_owner];
    }

    /** Create new tokens when called by the crowdsale contract.
     *  @param _recipient Address of newly created token recipient
     *  @param _value Amount of AVT to create
     *  @return success True if the transaction was successful
     */
    function createToken(address _recipient, uint _value)
        isMintable
        onlyMinter
        returns (bool)
    {
        balances[_recipient] += _value;
        supply += _value;
        
        return true;
    }

    /** Create new tokens when called by the crowdsale contract 
     *     which can only be traded after ILLIQUID_PERIOD
     *  @param _recipient Address of newly created token recipient
     *  @param _value Amount of AVT to create
     *  @return success True if the transaction was successful
     */
    function createIlliquidToken(address _recipient, uint _value)
        isMintable
        onlyMinter
        returns (bool)
    {
        illiquidBalances[_recipient] += _value;
        supply += _value;
        
        return true;
    }

    // Make sender's balance liquid after lockout period
    function makeLiquid()
        isLiquid
    {
        balances[msg.sender] += illiquidBalances[msg.sender];
        illiquidBalances[msg.sender] = 0;
    }

    /** Send _value amount of tokens to address _to
     *  @param _to The recipient of the transaction
     *  @param _value The amount to be transfered
     *  @return success Status of the transaction
     */
    function transfer(address _to, uint _value) 
        isTransferable
        hasFunds(msg.sender, _value)
        returns (bool) 
    {        
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        
        Transfer(msg.sender, _to, _value);

        return true;
    }

    /** Send _value amount of tokens from address _from to address _to
     *  @param _from Account sending the token
     *  @param _to Account receiving the token
     *  @param _value Amount of token being transfered
     *  @return success Status of the transaction
     */
    function transferFrom(address _from, address _to, uint _value)
        isTransferable
        hasFunds(_from, _value)
        hasAllowance(_from, _value)
        returns (bool) 
    {   
        balances[_from] -= _value;
        balances[_to] += _value;
        allowed[_from][msg.sender] -= _value;
       
        Transfer(_from, _to, _value);
        
        return true;
    }

    /** Allow _spender to withdraw up to _value from your account
     *  @param _spender Contract receiving permission to spend
     *  @param _value Amount of token that can be transfered
     *  @return success Status of the transaction
     */
    function approve(address _spender, uint _value) returns (bool) {
        /* To change the approve amount you first have to reduce the addresses
         *  allowed to zero by calling approve(_spender, 0) if it is not
         *  already 0 to mitigate the race condition described here:
         *  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
         */
        assert(_value == 0 || allowed[msg.sender][_spender] == 0);
        
        allowed[msg.sender][_spender] = _value;

        Approval(msg.sender, _spender, _value);
        
        return true;
    }

    /** Returns the amount which _spender can still withdraw from _owner
     *  @param _owner Owning account
     *  @param _spender Account allowed to spend on owners behalf
     *  @return remaining Amount that can still be transfered
     */
    function allowance(address _owner, address _spender) 
        constant 
        returns (uint) 
    {
        return allowed[_owner][_spender];
    }

    // Called whenever someone tries to send ether to it
    function () { throw; }
}
