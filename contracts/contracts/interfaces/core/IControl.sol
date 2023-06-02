// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IControl {
    function depositAsset(address _superToken, uint256 _amount) external;

    function withdrawAsset(address _superToken, uint256 _amount) external;

    function withdrawFeeBalance(address _superToken, uint256 _amount) external;

    function realizeFeeBalance(uint256 count, address _superToken) external;

    function setMinimumEndDuration(uint256 _duration) external;

    function setMinimumLifespan(uint256 _duration) external;

    function setSTBufferAmount(uint256 _duration) external;

    function addSuperToken(address _superToken) external;

    function removeSuperToken(address _superToken) external;

    function toggleBPS() external;

    function clearBPS() external;

    function setBPS(
        uint16[] memory _bpss,
        uint96[] memory _flowRateLowerBounds,
        uint96[] memory _flowRateUpperBounds,
        uint256[] memory _tags
    ) external;

    function setSBPS(uint16 _bps, address _user) external;

    function getFeeBalance(address _superToken) external view returns (uint256);

    function getControlData(
        address _superToken,
        uint256 _nonce
    ) external view returns (address, uint256, uint256, uint256);

    function getNewControlNonce(
        address _superToken
    ) external view returns (uint256);

    function getMinimumEndDuration() external view returns (uint256);

    function getMinimumLifespan() external view returns (uint256);

    function getSTBufferDurationInSecond() external view returns (uint256);

    function isSuperTokensSupported(
        address _superToken
    ) external view returns (bool);

    function isBPSEnabled() external view returns (bool);

    function getBPSSize() external view returns (uint256);

    function getBPSData(
        uint256 _tag
    ) external view returns (uint16, uint96, uint96);

    function getSBPS(address _user) external view returns (uint16);

    function getNewBufferedAppBalance(
        address _superToken,
        int96 _newFlowRate
    ) external view returns (uint256);

    function isNewFlowRateAllowed(
        address _superToken,
        int96 _newFlowRate
    ) external view returns (bool);

    function getAssetUser(
        address _user,
        address _superToken
    ) external view returns (uint256);

    function getAssetTotal(address _superToken) external view returns (uint256);
}
