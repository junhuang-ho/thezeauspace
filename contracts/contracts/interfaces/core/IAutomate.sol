// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IAutomate {
    function setGelatoContracts(address _ops) external;

    function getGelatoAddresses()
        external
        view
        returns (address, address, address, address, address);

    function withdrawGelatoFunds(uint256 _amount) external;

    function depositGelatoFunds() external payable;

    function setMinimumAppGelatoBalance(uint256 _value) external;

    function getMinimumAppGelatoBalance() external view returns (uint256);
}
