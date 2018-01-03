pragma solidity ^0.4.11;

import "./AVTToken.sol";
import "./SafeMath.sol";

// Crowd sale of AVT contract
contract TokenSale is SafeMath {
    // AVT PRICES (ETH/AVT)
    uint public constant PRICE_PRIV = 600000;
    uint public constant PRICE_BASE = 500000;
    
    // AVT TOKEN SPLIT
    uint public constant MAX_SUPPLY = 100000000000;
    uint public constant ALLOC_CROWDSALE = 60000000000;
    uint public constant ALLOC_LIQUID = 15000000000;
    uint public constant ALLOC_ILLIQUID = 25000000000;

    // PURCHASE LIMITS
    uint public constant PRIV_ALLOC_MAX = 30000000000;
    
    // START/END TIMES

    // Private crowd fund starts (in seconds)
    uint public privateStartTime;
    // Public crowd fund starts (in seconds)
    uint public publicStartTime;
    // Time crowdsale ends (in seconds)
    uint public publicEndTime;
    
    // IMPORTANT ADDRESSES

    // Private Sale Multisig Wallet Address
    address public privAddress;
    // Multisig Wallet Address to which all ether flows.
    address public multisigAddress;
    // Address to which all liquid and illiquid AVT is initially allocated.
    address public aventusAddress;
    // External AVT Token contract
    AVTToken public avtToken;
    
    // STATS
    uint public etherRaised;
    uint public avtSold;
    uint public privPortionRaised;

    // FUNCTION MODIFIERS

    // Checks if currently in pre crowdsale interval
    modifier isPreCrowdsale {
        assert(now >= privateStartTime && now < publicStartTime);
        _;
    }

    // Checks if currently in crowdsale interval
    modifier isCrowdsale {
        assert(now >= publicStartTime && now < publicEndTime);
        _;
    }

    // Checks if avt token has been created
    modifier isAVTSetup {
        assert(avtToken != AVTToken(0));
        _;
    }

    // Ensures function can only be called by priv address
    modifier isAddress(address addr) {
        assert(msg.sender == addr);
        _;
    }

    // EVENTS
    event TokenAddress(AVTToken indexed _token);
    event PreBuy(uint _amount);
    event Buy(address indexed _recipient, uint _amount);

    // FUNCTIONS

    /* Constructor- deploys AVTToken contract, creates initial AVT entitlements
     * @param _priv The presale multisig wallet address
     * @param _aventus Aventus address, initially holds subset of AVT allocs
     * @param _multisig The multisig wallet to which raised funds go
     * @param _publicStartTime Start time of public crowdsale
     * @param _privateStartTime Start time of private sale
     */
    function TokenSale(
        address _priv,
        address _aventus,
        address _multisig,
        uint _publicStartTime,
        uint _privateStartTime
    ) {
        privAddress = _priv;
        multisigAddress = _multisig;
        aventusAddress = _aventus;

        privateStartTime = _privateStartTime;
        publicStartTime = _publicStartTime;
        publicEndTime = _publicStartTime + 5 days;
    }

   // Creates the AVT token contract and mints coins for AVT not for sale
    function setupAVT() 
        isAddress(aventusAddress)
    {
        avtToken = new AVTToken(publicEndTime);

        avtToken.createToken(aventusAddress, ALLOC_LIQUID);
        avtToken.createIlliquidToken(aventusAddress, ALLOC_ILLIQUID);

        TokenAddress(avtToken);
    }

    /* Private: Processes AVT Purchase
     * @param _rate The exchange rate of ETH/AVT
     * @param _remaining Amount of AVT remaining for buyer
     */
    function processPurchase(uint _rate, uint _remaining)
        private
        returns (uint amount)
    {
        amount = safeDiv(safeMul(msg.value, _rate), 1 ether);
        
        // Throw if amount sent takes over sale limit
        assert(amount <= _remaining);
        
        // Send ether to multisig wallet
        assert(multisigAddress.send(msg.value));
        
        // Mint AVT tokens
        assert(avtToken.createToken(msg.sender, amount));
        
        // Update statistics
        avtSold += amount;
        etherRaised += msg.value;
    }

    // Only called by private raise address, only during the pre-crowdsale period
    function preBuy()
        payable
        isPreCrowdsale
        isAddress(privAddress)
        isAVTSetup
    {
        // Ensure with _remaining val that priviat can't raise more than their limit
        uint amount = processPurchase(PRICE_PRIV, PRIV_ALLOC_MAX - privPortionRaised);
        privPortionRaised += amount;

        PreBuy(amount);
    }

    // Default function during crowdsale - Creates AVT Tokens if enough remaining
    function()
        payable
        isCrowdsale
        isAVTSetup
    {
        // Ensure no more than crowdsale limit can be sold
        uint amount = processPurchase(PRICE_BASE, ALLOC_CROWDSALE - avtSold);
        
        Buy(msg.sender, amount);
    }
}
