// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.9;

import {LibAccessControl} from "../../libraries/utils/LibAccessControl.sol";
import {LibControl, ArrayLengthNotMatch, InvalidFlowRateBounds} from "../../libraries/core/LibControl.sol";
import {IControl} from "../../interfaces/core/IControl.sol";

import {IterableMappingBPS} from "../../libraries/utils/IterableMappingBPS.sol";

contract Control is IControl {
    function depositAsset(address _superToken, uint256 _amount) external {
        LibControl._requireSuperTokenSupported(_superToken);
        LibControl._depositAsset(_superToken, _amount);
    }

    function withdrawAsset(address _superToken, uint256 _amount) external {
        /**
         * don't need to check if supertoken suppported or not
         * as there may be a chance that a supported supertoken
         * gets removed but there is still user funds in the app
         *
         * in that case, just let user withdraw as will fail anyway if 0 amount
         */
        LibControl._withdrawAsset(_superToken, _amount);
    }

    function withdrawFeeBalance(address _superToken, uint256 _amount) external {
        LibAccessControl._requireOnlyRole(LibAccessControl.TREASURER_ROLE);
        LibControl._withdrawFeeBalance(_superToken, _amount);
    }

    /**
     * do external analysis on up to what count flow ended
     * to determine what `count` should be
     */
    function realizeFeeBalance(uint256 count, address _superToken) external {
        LibControl._realizeFeeBalance(count, _superToken);
    } // TODO: safe to allow anyone to call it?

    function setMinimumEndDuration(uint256 _duration) external {
        LibAccessControl._requireOnlyRole(LibAccessControl.STRATEGIST_ROLE);
        LibControl._requireNonZeroValue(_duration);
        LibControl._setMinimumEndDuration(_duration);
    }

    function setMinimumLifespan(uint256 _duration) external {
        LibAccessControl._requireOnlyRole(LibAccessControl.STRATEGIST_ROLE);
        LibControl._requireNonZeroValue(_duration);
        LibControl._setMinimumLifespan(_duration);
    }

    function setSTBufferAmount(uint256 _duration) external {
        LibAccessControl._requireOnlyRole(LibAccessControl.STRATEGIST_ROLE);
        LibControl._requireNonZeroValue(_duration);
        LibControl._setSTBufferAmount(_duration);
    }

    function addSuperToken(address _superToken) external {
        LibAccessControl._requireOnlyRole(LibAccessControl.STRATEGIST_ROLE);
        LibControl._addSuperToken(_superToken);
    }

    function removeSuperToken(address _superToken) external {
        LibAccessControl._requireOnlyRole(LibAccessControl.STRATEGIST_ROLE);
        LibControl._removeSuperToken(_superToken);
    }

    function toggleBPS() external {
        LibAccessControl._requireOnlyRole(LibAccessControl.STRATEGIST_ROLE);
        LibControl._toggleBPS();
    }

    function clearBPS() external {
        LibAccessControl._requireOnlyRole(LibAccessControl.STRATEGIST_ROLE);
        LibControl._clearBPS();
    }

    /**
     * - flowRate must be asc value
     * - flowRateUpperBound value of i must be equal flowRateLowerBound value of i+1
     *
     * eg:
     *
     * array | tag |     bound     | bps
     * index |     | lower | upper |
     * ----------------------------------
     *   0   |  1  | 0.001 | 0.002 | 4000 (40%)
     *   1   |  2  | 0.002 | 0.003 | 2000 (20%)
     *   2   |  3  | 0.003 | 0.005 |  500 (5%)
     *
     * how to call (eg):
     * first call has tags related to 720p
     * second call has tags related to 1080p
     *
     */
    function setBPS(
        uint16[] memory _bpss,
        uint96[] memory _flowRateLowerBounds,
        uint96[] memory _flowRateUpperBounds,
        uint256[] memory _tags
    ) external {
        LibAccessControl._requireOnlyRole(LibAccessControl.STRATEGIST_ROLE);
        if (
            _bpss.length != _flowRateLowerBounds.length ||
            _bpss.length != _flowRateUpperBounds.length ||
            _bpss.length != _tags.length
        ) revert ArrayLengthNotMatch();

        for (uint256 i = 0; i < _bpss.length; i++) {
            if (i < _bpss.length - 1) {
                if (_flowRateUpperBounds[i] != _flowRateLowerBounds[i + 1])
                    revert InvalidFlowRateBounds();
            }

            LibControl._setBPS(
                _bpss[i],
                _flowRateLowerBounds[i],
                _flowRateUpperBounds[i],
                _tags[i]
            );
        }
    }

    function setSBPS(uint16 _bps, address _user) external {
        LibAccessControl._requireOnlyRole(LibAccessControl.STRATEGIST_ROLE);
        LibControl._setSBPS(_bps, _user);
    }

    function getFeeBalance(
        address _superToken
    ) external view returns (uint256) {
        return LibControl._getFeeBalance(_superToken);
    }

    function getControlData(
        address _superToken,
        uint256 _nonce
    ) external view returns (address, uint256, uint256, uint256) {
        return LibControl._getControlData(_superToken, _nonce);
    }

    function getNewControlNonce(
        address _superToken
    ) external view returns (uint256) {
        return LibControl._getNewNonce(_superToken);
    }

    function getMinimumEndDuration() external view returns (uint256) {
        return LibControl._getMinimumEndDuration();
    }

    function getMinimumLifespan() external view returns (uint256) {
        return LibControl._getMinimumLifespan();
    }

    function getSTBufferDurationInSecond() external view returns (uint256) {
        return LibControl._getSTBufferDurationInSecond();
    }

    function isSuperTokensSupported(
        address _superToken
    ) external view returns (bool) {
        return LibControl._isSuperTokensSupported(_superToken);
    }

    function isBPSEnabled() external view returns (bool) {
        return LibControl._isBPSEnabled();
    }

    function getBPSSize() external view returns (uint256) {
        return LibControl._getBPSSize();
    }

    function getBPSData(
        uint256 _tag
    ) external view returns (uint16, uint96, uint96) {
        return LibControl._getBPSData(_tag);
    }

    function getSBPS(address _user) external view returns (uint16) {
        return LibControl._getSBPS(_user);
    }

    function getNewBufferedAppBalance(
        address _superToken,
        int96 _newFlowRate
    ) external view returns (uint256) {
        return LibControl._getNewBufferedAppBalance(_superToken, _newFlowRate);
    } // helper

    function isNewFlowRateAllowed(
        address _superToken,
        int96 _newFlowRate
    ) external view returns (bool) {
        return LibControl._isNewFlowRateAllowed(_superToken, _newFlowRate);
    } // helper

    function getAssetUser(
        address _user,
        address _superToken
    ) external view returns (uint256) {
        return LibControl._getAssetUser(_user, _superToken);
    }

    function getAssetTotal(
        address _superToken
    ) external view returns (uint256) {
        return LibControl._getAssetTotal(_superToken);
    }
}
