// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.9;

import {LibControl, ArrayLengthNotMatch} from "../../libraries/core/LibControl.sol";
import {LibSession} from "../../libraries/core/LibSession.sol";
import {ISession} from "../../interfaces/core/ISession.sol";

contract Session is ISession {
    function startSession(
        address _superToken,
        uint96 _flowRate,
        uint256 _tag
    ) external {
        LibControl._requireSuperTokenSupported(_superToken);
        LibSession._startSession(_superToken, _flowRate, _tag);

        LibSession.StorageSession storage sSession = LibSession
            ._storageSession();

        sSession.sessionCurrent[msg.sender].timestamp = block.timestamp;
        sSession.sessionCurrent[msg.sender].superTokens.push(_superToken);
    } // TODO: test // if want to do open 1 livestream and supp multiple token, can do externally "batch tx" (TODO: test this, otherwise cr8 new fn using loops)

    function stopSession(address _superToken) external {
        // LibControl._requireSuperTokenSupported(_superTokens[i]);
        /**
         * don't need to check if supertoken suppported or not
         * as there may be a chance that a supported supertoken
         * gets removed but there is still session active with the
         * supertoken
         *
         * in that case, just let user withdraw as will fail anyway if 0 amount
         */

        LibSession._stopSession(_superToken);
        delete LibSession._storageSession().sessionCurrent[msg.sender];
    } // TODO: test

    function startSessions(
        address[] memory _superTokens,
        uint96[] memory _flowRates,
        uint256[] memory _tags
    ) external {
        if (
            _superTokens.length != _flowRates.length ||
            _superTokens.length != _tags.length
        ) revert ArrayLengthNotMatch();

        for (uint256 i = 0; i < _superTokens.length; i++) {
            LibControl._requireSuperTokenSupported(_superTokens[i]);
            LibSession._startSession(_superTokens[i], _flowRates[i], _tags[i]);
        }

        LibSession.StorageSession storage sSession = LibSession
            ._storageSession();

        sSession.sessionCurrent[msg.sender].timestamp = block.timestamp;
        sSession.sessionCurrent[msg.sender].superTokens = _superTokens;
    }

    function stopSessions(address[] memory _superTokens) external {
        for (uint256 i = 0; i < _superTokens.length; i++) {
            // LibControl._requireSuperTokenSupported(_superTokens[i]);
            /**
             * don't need to check if supertoken suppported or not
             * as there may be a chance that a supported supertoken
             * gets removed but there is still session active with the
             * supertoken
             *
             * in that case, just let user withdraw as will fail anyway if 0 amount
             */

            LibSession._stopSession(_superTokens[i]);
        }

        delete LibSession._storageSession().sessionCurrent[msg.sender];
    }

    function getNewSessionNonce(
        address _user,
        address _superToken
    ) external view returns (uint256) {
        return LibSession._getNewNonce(_user, _superToken);
    }

    function getSessionData(
        address _user,
        address _superToken,
        uint256 _nonce
    ) external view returns (int96, uint96, uint256, uint256) {
        return LibSession._getSessionData(_user, _superToken, _nonce);
    }

    function getCurrentSessionData(
        address _user
    ) external view returns (uint256, address[] memory) {
        return LibSession._getCurrentSessionData(_user);
    }
}
