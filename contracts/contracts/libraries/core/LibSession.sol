//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.9;

import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";

import {LibControl, InvalidFlowRate} from "./LibControl.sol";
import {LibFlow} from "./LibFlow.sol";

error PreviousSessionStillLive();
error SessionNotStarted();
error SessionAlreadyEnded();

library LibSession {
    using SuperTokenV1Library for ISuperToken;

    bytes32 constant STORAGE_POSITION_SESSION = keccak256("ds.session");

    struct SessionCurrent {
        uint256 timestamp;
        address[] superTokens;
    }

    struct SessionRecord {
        int96 effectiveFlowRate;
        uint96 flowRate;
        uint256 timestampStart;
        uint256 timestampStop;
    }

    struct StorageSession {
        mapping(address => mapping(address => uint256)) sessionNonce; // broadcaster --> superToken --> nonce (counter)
        mapping(address => mapping(address => mapping(uint256 => SessionRecord))) sessionRecord; // broadcaster --> superToken --> nonce --> session history
        mapping(address => SessionCurrent) sessionCurrent; // broadcaster --> current live session
    }

    function _storageSession()
        internal
        pure
        returns (StorageSession storage s)
    {
        bytes32 position = STORAGE_POSITION_SESSION;
        assembly {
            s.slot := position
        }
    }

    ///// ------- functions ------ /////

    ///// -------- mains --------- /////

    /**
     * startSession helps with
     * 1. ensures only one supertoken session per broadcaster is open
     *    (may have multiple sessionRecord but at different supertokens).
     * 2. to verify if different supertoken session belongs to the same "livestream",
     *    for every supertoken latest nonce, `timestampStart` must equal `currentTimestamp`,
     *    and currentTimestamp != 0. Do check externally (frontend/backend)
     *
     * note: currently allows start session even if msg.sender has an open flow
     */
    function _startSession(
        address _superToken,
        uint96 _flowRate,
        uint256 _tag
    ) internal {
        StorageSession storage sSession = _storageSession();
        uint256 newNonce = _getNewNonce(msg.sender, _superToken);

        if (
            newNonce > 0 &&
            sSession
            .sessionRecord[msg.sender][_superToken][newNonce - 1]
                .timestampStop ==
            0
        ) revert PreviousSessionStillLive();

        int96 effectiveFlowRate = _getEffectiveFlowRate(
            msg.sender,
            _flowRate,
            _tag
        ); // TODO: test

        // start session
        sSession
        .sessionRecord[msg.sender][_superToken][newNonce]
            .effectiveFlowRate = effectiveFlowRate;
        sSession
        .sessionRecord[msg.sender][_superToken][newNonce].flowRate = _flowRate;
        sSession
        .sessionRecord[msg.sender][_superToken][newNonce].timestampStart = block
            .timestamp;

        // finish
        _storageSession().sessionNonce[msg.sender][_superToken] += 1;
    } // TODO: add require app gelato bal, after adding auto end sess functionality

    function _stopSession(address _superToken) internal {
        uint256 activeNonce = _getCurrentNonce(msg.sender, _superToken);
        if (
            _storageSession()
            .sessionRecord[msg.sender][_superToken][activeNonce]
                .timestampStart == 0
        ) revert SessionNotStarted();
        if (
            _storageSession()
            .sessionRecord[msg.sender][_superToken][activeNonce]
                .timestampStop != 0
        ) revert SessionAlreadyEnded();

        ISuperToken iSuperToken = ISuperToken(_superToken);
        int96 flowRate = iSuperToken.getFlowRate(address(this), msg.sender);
        if (flowRate != 0) iSuperToken.deleteFlow(address(this), msg.sender);

        // update
        _storageSession()
        .sessionRecord[msg.sender][_superToken][activeNonce]
            .timestampStop = block.timestamp;
    } // all the active taskId will just fail to execute

    ///// ------- requires ------- /////

    ///// ------- setters -------- /////

    ///// ------- getters -------- /////

    function _getEffectiveFlowRate(
        address _user,
        uint96 _flowRate,
        uint256 _tag
    ) internal view returns (int96) {
        uint16 bps;
        uint16 sbps = LibControl._storageControl().sbps[_user];
        if (sbps > 0) {
            bps = sbps;
        } else {
            if (LibControl._isBPSEnabled())
                bps = LibControl._getValidBPS(_flowRate, _tag);
        }

        if (bps == 0) {
            return int96(_flowRate);
        } else {
            if ((_flowRate * bps) < LibControl.bpsMax) revert InvalidFlowRate();
            return int96((_flowRate * bps) / LibControl.bpsMax);
        }
    } // TODO: test

    function _getNewNonce(
        address _user,
        address _superToken
    ) internal view returns (uint256) {
        return _storageSession().sessionNonce[_user][_superToken];
    }

    function _getCurrentNonce(
        address _user,
        address _superToken
    ) internal view returns (uint256) {
        uint256 nonce = _storageSession().sessionNonce[_user][_superToken];
        return nonce == 0 ? 0 : nonce - 1;
    }

    function _getCurrentSessionData(
        address _user
    ) internal view returns (uint256, address[] memory) {
        return (
            _storageSession().sessionCurrent[_user].timestamp,
            _storageSession().sessionCurrent[_user].superTokens
        );
    }

    function _getSessionData(
        address _user,
        address _superToken,
        uint256 _nonce
    ) internal view returns (int96, uint96, uint256, uint256) {
        return (
            _storageSession()
            .sessionRecord[_user][_superToken][_nonce].effectiveFlowRate,
            _storageSession()
            .sessionRecord[_user][_superToken][_nonce].flowRate,
            _storageSession()
            .sessionRecord[_user][_superToken][_nonce].timestampStart,
            _storageSession()
            .sessionRecord[_user][_superToken][_nonce].timestampStop
        );
    }

    function _getSessionDataFromFlow(
        address _user,
        address _superToken,
        uint256 _nonce
    ) internal view returns (int96, uint96, uint256, uint256) {
        LibFlow.StorageFlow storage sFlow = LibFlow._storageFlow();

        address receiver = sFlow
        .flowRecord[_user][_superToken][_nonce].receiver;
        uint256 sessionNonce = sFlow
        .flowRecord[_user][_superToken][_nonce].sessionNonce;

        return _getSessionData(receiver, _superToken, sessionNonce);
    }

    function _getSessionDataFromControl(
        address _superToken,
        uint256 _nonce
    ) internal view returns (int96, uint96, uint256, uint256) {
        LibControl.StorageControl storage sControl = LibControl
            ._storageControl();

        address receiver = sControl.controlRecord[_superToken][_nonce].receiver;
        uint256 sessionNonce = sControl
        .controlRecord[_superToken][_nonce].sessionNonce;

        return _getSessionData(receiver, _superToken, sessionNonce);
    }

    ///// -------- utils --------- /////
}
