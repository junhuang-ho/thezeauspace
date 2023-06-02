//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.9;

import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {IterableMappingBPS, BasisPointsRange} from "../utils/IterableMappingBPS.sol";

import {LibSession} from "./LibSession.sol";

error ZeroValue();
error ArrayLengthNotMatch();
error InvalidSuperToken();
error InsufficientAppSTBalance();
error InsufficientAssets();
error InsufficientFeeBalance();
error InvalidFlowRateBounds();
error InvalidBasisPoints();
error InvalidFlowRate();
error ContractError();

library LibControl {
    using SuperTokenV1Library for ISuperToken;
    using IterableMappingBPS for IterableMappingBPS.Map;

    bytes32 constant STORAGE_POSITION_CONTROL = keccak256("ds.control");
    uint8 internal constant bpsMin = 100;
    uint16 internal constant bpsMax = 10000;

    struct ControlRecord {
        address receiver;
        uint256 sessionNonce;
        uint256 timestampIncrease;
        uint256 timestampDecrease;
    }

    struct StorageControl {
        IterableMappingBPS.Map bps; // howtouse: input tag (uint256), check if input flowRate is within range of bounds, if not revert
        mapping(address => uint16) sbps; // special
        bool isBPSEnabled;
        uint256 minimumEndDuration; // seconds
        uint256 minimumLifespan; // seconds
        uint256 stBufferDurationInSecond;
        mapping(address => bool) superTokens;
        //
        mapping(address => uint256) unsettledControlNonce;
        mapping(address => uint256) controlNonce; // superToken --> nonce
        mapping(address => mapping(uint256 => ControlRecord)) controlRecord; // superToken --> nonce --> control record
        mapping(address => uint256) feeBalance; // superToken --> amount fee balance
        //
        mapping(address => mapping(address => uint256)) assets; // investor --> superToken --> amount deposit
        mapping(address => uint256) totalAssets; // superToken --> total amount
    }

    function _storageControl()
        internal
        pure
        returns (StorageControl storage s)
    {
        bytes32 position = STORAGE_POSITION_CONTROL;
        assembly {
            s.slot := position
        }
    }

    ///// ------- functions ------ /////

    ///// -------- mains --------- /////

    function _depositAsset(address _superToken, uint256 _amount) internal {
        ISuperToken(_superToken).transferFrom(
            msg.sender,
            address(this),
            _amount
        );

        _storageControl().assets[msg.sender][_superToken] += _amount;
        _storageControl().totalAssets[_superToken] += _amount;
    }

    function _withdrawAsset(address _superToken, uint256 _amount) internal {
        if (_storageControl().assets[msg.sender][_superToken] < _amount)
            revert InsufficientAssets();

        _storageControl().assets[msg.sender][_superToken] -= _amount;
        _storageControl().totalAssets[_superToken] -= _amount;

        ISuperToken(_superToken).transfer(msg.sender, _amount);
    }

    function _withdrawFeeBalance(
        address _superToken,
        uint256 _amount
    ) internal {
        if (_storageControl().feeBalance[_superToken] < _amount)
            revert InsufficientFeeBalance();

        _storageControl().feeBalance[_superToken] -= _amount;

        ISuperToken(_superToken).transferFrom(
            address(this),
            msg.sender,
            _amount
        );
    }

    function _realizeFeeBalance(uint256 count, address _superToken) internal {
        _storageControl().feeBalance[_superToken] += _getAppFeeBalance(
            count,
            _superToken,
            true
        );
    }

    function _getAppFeeBalance(
        uint256 count,
        address _superToken,
        bool _isSettle
    ) internal returns (uint256) {
        StorageControl storage sControl = _storageControl();
        uint256 unsettledControlNonce = sControl.unsettledControlNonce[
            _superToken
        ];
        // uint256 remainingNonces = _getNewNonce(_superToken) -
        //     unsettledControlNonce;

        uint256 amountFee;
        for (uint256 i = 0; i < count; i++) {
            // uint256 ii = unsettledControlNonce + i;
            // uint256 timestampIncrease = sControl
            // .controlRecord[_superToken][ii].timestampIncrease;
            // uint256 timestampDecrease = sControl
            // .controlRecord[_superToken][ii].timestampDecrease;

            // (
            //     int96 effectiveFlowRate,
            //     uint96 flowRate,
            //     ,
            //     uint256 timestampStop
            // ) = LibSession._getSessionDataFromControl(_superToken, ii);

            // uint256 feeFlowRate = flowRate - uint96(effectiveFlowRate);

            // if (timestampDecrease != 0) {
            //     amountFee +=
            //         feeFlowRate *
            //         (timestampDecrease - timestampIncrease);
            // } else if (timestampStop != 0) {
            //     amountFee += feeFlowRate * (timestampStop - timestampIncrease);
            // } else {
            //     revert ContractError(); // for some reason ran this code when both timestampDecrease && timestampStop == 0
            // }

            amountFee += _calculateAmountFee(
                _superToken,
                unsettledControlNonce + i
            );

            if (_isSettle) sControl.unsettledControlNonce[_superToken] += 1;
        }

        return amountFee;
    } // TODO: as we cannot control when flow starts, do a "nonce until" input to set up to which record we want to calculate for

    // TODO: if session doesn't end, we stuck cannot withdraw as withdraw fee amount depends on both flow and sess and iterates linearly, more reason to implement sesion auto end

    function _calculateAmountFee(
        address _superToken,
        uint256 _nonce
    ) internal view returns (uint256) {
        StorageControl storage sControl = _storageControl();
        uint256 timestampIncrease = sControl
        .controlRecord[_superToken][_nonce].timestampIncrease;
        uint256 timestampDecrease = sControl
        .controlRecord[_superToken][_nonce].timestampDecrease;

        (
            int96 effectiveFlowRate,
            uint96 flowRate,
            ,
            uint256 timestampStop
        ) = LibSession._getSessionDataFromControl(_superToken, _nonce);

        uint256 feeFlowRate = flowRate - uint96(effectiveFlowRate);

        if (timestampDecrease != 0) {
            return feeFlowRate * (timestampDecrease - timestampIncrease);
        } else if (timestampStop != 0) {
            return feeFlowRate * (timestampStop - timestampIncrease);
        } else {
            revert ContractError(); // for some reason ran this code when both timestampDecrease && timestampStop == 0
        }
    }

    ///// ------- requires ------- /////

    function _requireNonZeroValue(uint256 _value) internal pure {
        if (_value <= 0) revert ZeroValue();
    }

    function _requireSuperTokenSupported(address _superToken) internal view {
        if (!_isSuperTokensSupported(_superToken)) revert InvalidSuperToken();
    }

    /**
     * guard against how long before app runs out of funds and loses its deposit
     *
     * * `STBufferDurationInSecond` is a critical parameter and should be set as large as possible
     */
    function _requireSufficientAppSTBalance(
        address _superToken,
        int96 _newFlowRate
    ) internal view {
        if (!_isNewFlowRateAllowed(_superToken, _newFlowRate))
            revert InsufficientAppSTBalance();
    }

    function _requireValidBasisPoints(uint16 _bps) internal pure {
        if (_bps < bpsMin || _bps > bpsMax) revert InvalidBasisPoints();
    }

    ///// ------- setters -------- /////

    function _getNewNonce(address _superToken) internal view returns (uint256) {
        return _storageControl().controlNonce[_superToken];
    }

    function _setMinimumEndDuration(uint256 _duration) internal {
        _storageControl().minimumEndDuration = _duration;
    }

    function _setMinimumLifespan(uint256 _duration) internal {
        _storageControl().minimumLifespan = _duration;
    }

    function _setSTBufferAmount(uint256 _duration) internal {
        _storageControl().stBufferDurationInSecond = _duration;
    }

    function _addSuperToken(address _superToken) internal {
        _storageControl().superTokens[_superToken] = true;
    }

    function _removeSuperToken(address _superToken) internal {
        delete _storageControl().superTokens[_superToken];
    }

    function _toggleBPS() internal {
        _storageControl().isBPSEnabled = !_storageControl().isBPSEnabled;
    }

    function _clearBPS() internal {
        uint256 sizeBeforeClear = _getBPSSize();
        for (uint256 i = 0; i < sizeBeforeClear; i++) {
            uint256 tag = _storageControl().bps.getKeyAtIndex(
                _getBPSSize() - 1
            );
            _storageControl().bps.remove(tag);
        }
    }

    function _setBPS(
        uint16 _bps,
        uint96 _flowRateLowerBound,
        uint96 _flowRateUpperBound,
        uint256 _tag
    ) internal {
        _requireValidBasisPoints(_bps);
        if (_flowRateUpperBound < _flowRateLowerBound)
            revert InvalidFlowRateBounds();
        _storageControl().bps.set(
            _tag,
            _bps,
            _flowRateLowerBound,
            _flowRateUpperBound
        );
    }

    function _setSBPS(uint16 _bps, address _user) internal {
        _requireValidBasisPoints(_bps);
        _storageControl().sbps[_user] = _bps;
    } // to clear, just call and set _bps to 0 value

    ///// ------- getters -------- /////

    function _getFeeBalance(
        address _superToken
    ) internal view returns (uint256) {
        return _storageControl().feeBalance[_superToken];
    }

    function _getControlData(
        address _superToken,
        uint256 _nonce
    ) internal view returns (address, uint256, uint256, uint256) {
        address receiver = _storageControl()
        .controlRecord[_superToken][_nonce].receiver;
        uint256 sessionNonce = _storageControl()
        .controlRecord[_superToken][_nonce].sessionNonce;
        uint256 timestampIncrease = _storageControl()
        .controlRecord[_superToken][_nonce].timestampIncrease;
        uint256 timestampDecrease = _storageControl()
        .controlRecord[_superToken][_nonce].timestampDecrease;

        return (receiver, sessionNonce, timestampIncrease, timestampDecrease);
    }

    function _getMinimumEndDuration() internal view returns (uint256) {
        return _storageControl().minimumEndDuration;
    }

    function _getMinimumLifespan() internal view returns (uint256) {
        return _storageControl().minimumLifespan;
    }

    function _getSTBufferDurationInSecond() internal view returns (uint256) {
        return _storageControl().stBufferDurationInSecond;
    }

    function _isSuperTokensSupported(
        address _superToken
    ) internal view returns (bool) {
        return _storageControl().superTokens[_superToken];
    }

    function _isBPSEnabled() internal view returns (bool) {
        return _storageControl().isBPSEnabled;
    }

    function _getBPSSize() internal view returns (uint256) {
        return _storageControl().bps.size();
    }

    function _getValidBPS(
        uint96 _flowRate,
        uint256 _tag
    ) internal view returns (uint16) {
        (
            uint16 bps,
            uint96 flowRateLowerBound,
            uint96 flowRateUpperBound
        ) = _getBPSData(_tag);

        if (_flowRate < flowRateLowerBound || _flowRate >= flowRateUpperBound)
            revert InvalidFlowRate();

        return bps;
    }

    function _getBPSData(
        uint256 _tag
    ) internal view returns (uint16, uint96, uint96) {
        BasisPointsRange memory data = _storageControl().bps.get(_tag);
        return (data.bps, data.flowRateLowerBound, data.flowRateUpperBound);
    }

    function _getSBPS(address _user) internal view returns (uint16) {
        return _storageControl().sbps[_user];
    }

    function _getNewBufferedAppBalance(
        address _superToken,
        int96 _newFlowRate
    ) internal view returns (uint256) {
        ISuperToken iSuperToken = ISuperToken(_superToken);
        uint256 newBufferAmount = iSuperToken.getBufferAmountByFlowRate(
            _newFlowRate
        );
        int96 contractNetFlowRate = iSuperToken.getNetFlowRate(address(this));

        return
            newBufferAmount +
            (uint256(uint96(contractNetFlowRate + _newFlowRate)) *
                _storageControl().stBufferDurationInSecond);
    }

    function _isNewFlowRateAllowed(
        address _superToken,
        int96 _newFlowRate
    ) internal view returns (bool) {
        uint256 contractBalance = ISuperToken(_superToken).balanceOf(
            address(this)
        );

        return
            contractBalance >
            _getNewBufferedAppBalance(_superToken, _newFlowRate);
    }

    function _getAssetUser(
        address _user,
        address _superToken
    ) internal view returns (uint256) {
        return _storageControl().assets[_user][_superToken];
    }

    function _getAssetTotal(
        address _superToken
    ) internal view returns (uint256) {
        return _storageControl().totalAssets[_superToken];
    }

    ///// -------- utils --------- /////
}

// TODO: a way to differentiate "earned" holdings from all holdings
