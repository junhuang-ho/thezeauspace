// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

interface IFlow {
    function openFlow(
        address _receiver,
        address _superToken,
        uint256 _lifespan
    ) external;

    function decreaseFlow(
        address _superToken,
        address _sender,
        address _receiver,
        uint256 _nonce,
        int96 _flowRate
    ) external;

    function closeFlow(address _superToken, uint256 _nonce) external;

    function depositSuperToken(address _superToken, uint256 _amount) external;

    function withdrawSuperToken(address _superToken, uint256 _amount) external;

    function getAmountFlowed(
        address _user,
        address _superToken
    ) external view returns (uint256);

    function getValidSafeLifespan(
        address _user,
        address _superToken,
        int96 _flowRate
    ) external view returns (uint256);

    function isViewSessionAllowed(
        address _viewer,
        address _broadcaster
    ) external view returns (bool);

    function hasActiveFlow(
        address _user,
        address _superToken
    ) external view returns (bool);

    function getNewFlowNonce(
        address _user,
        address _superToken
    ) external view returns (uint256);

    function getFlowData(
        address _user,
        address _superToken,
        uint256 _nonce
    ) external view returns (address, uint256, uint256, uint256, bytes32, bool);

    function getDepositUser(
        address _user,
        address _superToken
    ) external view returns (uint256);

    function getDepositTotal(
        address _superToken
    ) external view returns (uint256);
}
