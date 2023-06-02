// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ISession {
    function startSession(
        address _superToken,
        uint96 _flowRate,
        uint256 _tag
    ) external;

    function stopSession(address _superToken) external;

    function startSessions(
        address[] memory _superTokens,
        uint96[] memory _flowRates,
        uint256[] memory _tags
    ) external;

    function stopSessions(address[] memory _superTokens) external;

    function getNewSessionNonce(
        address _user,
        address _superToken
    ) external view returns (uint256);

    function getSessionData(
        address _user,
        address _superToken,
        uint256 _nonce
    ) external view returns (int96, uint96, uint256, uint256);

    function getCurrentSessionData(
        address _user
    ) external view returns (uint256, address[] memory);
}
