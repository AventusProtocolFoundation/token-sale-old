pragma solidity ^0.4.11;

// SafeMath Contract to ensure arithmetic integrity
contract SafeMath {

    /* Safe multiplication 
     * @param a First number
     * @param b Second number
     * @return The multiplication of a * b with no without overflow
     */
    function safeMul(uint a, uint b) internal returns (uint) {
        uint c = a * b;
        assert(a == 0 || c / a == b);

        return c;
    }

    /* Safe division 
     * @param a First number
     * @param b Second number
     * @return The division of a * b with no remainder and no div 0
     */
    function safeDiv(uint a, uint b) internal returns (uint) {
        assert(b > 0);
        uint c = a / b;
        assert(a == b * c + a % b);

        return c;
    }
}