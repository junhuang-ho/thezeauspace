// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.9;

import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";

import {LibAutomate} from "../../libraries/core/LibAutomate.sol";
import {LibControl, ArrayLengthNotMatch} from "../../libraries/core/LibControl.sol";
import {LibSession, SessionNotStarted} from "../../libraries/core/LibSession.sol";
import {LibFlow} from "../../libraries/core/LibFlow.sol";
import {IFlow} from "../../interfaces/core/IFlow.sol";

import "../../services/gelato/Types.sol";

error TooEarly();

contract Flow is IFlow {
    using SuperTokenV1Library for ISuperToken;

    /**
     * important:
     * with this `openFlow` implementation, it is possible to
     * open multiple flows with same session (cost to much to implement checks)
     * this does not cause an
     *
     * note: currently allows open flow even if msg.sender has an active session
     */
    /**
     * // TODO: need to check if you have sufficient deposits left or not
     * SOL1: have user manually off flow
     * SOL2: force settle blaance before open next flow (also force settle before withdraw)
     */
    function openFlow(
        address _receiver,
        address _superToken,
        uint256 _lifespan
    ) external {
        LibFlow._requireNoActiveFlow(_superToken); // as we cannot detect when user is trying to open multiple active flows to same session, we just restrict flow opening to 1 active globally at a time
        LibFlow._setRemainingBalance(msg.sender, _superToken); // TODO: test

        LibAutomate._requireSufficientAppGelatoBalance();
        LibControl._requireSuperTokenSupported(_superToken);
        LibSession.StorageSession storage sSession = LibSession
            ._storageSession();
        uint256 activeSessionNonce = LibSession._getCurrentNonce(
            _receiver,
            _superToken
        );

        if (
            sSession
            .sessionRecord[_receiver][_superToken][activeSessionNonce]
                .timestampStart == 0
        ) revert SessionNotStarted();

        LibFlow.StorageFlow storage sFlow = LibFlow._storageFlow();
        int96 flowRate = sSession
        .sessionRecord[_receiver][_superToken][activeSessionNonce]
            .effectiveFlowRate;
        LibControl._requireSufficientAppSTBalance(_superToken, flowRate);
        uint256 scheduledLifespan = LibFlow._getScheduledLifespan(
            msg.sender,
            _superToken,
            _lifespan,
            flowRate
        ); // indirectly checks if sufficient deposit or not

        // 1. set flow info
        uint256 newFlowNonce = LibFlow._getNewNonce(msg.sender, _superToken);

        sFlow
        .flowRecord[msg.sender][_superToken][newFlowNonce].receiver = _receiver;
        sFlow
        .flowRecord[msg.sender][_superToken][newFlowNonce]
            .sessionNonce = activeSessionNonce;

        LibControl.StorageControl storage sControl = LibControl
            ._storageControl();
        uint256 newControlNonce = sControl.controlNonce[_superToken];
        sControl
        .controlRecord[_superToken][newControlNonce].receiver = _receiver;
        sControl
        .controlRecord[_superToken][newControlNonce]
            .sessionNonce = activeSessionNonce;
        sControl
        .controlRecord[_superToken][newControlNonce].timestampIncrease = block
            .timestamp;
        sFlow
        .flowRecord[msg.sender][_superToken][newFlowNonce]
            .controlNonce = newControlNonce;

        // 2. start flow immediately
        LibFlow._increaseFlow(
            _superToken,
            msg.sender,
            _receiver,
            newFlowNonce,
            flowRate
        );

        // // 3. schedule stop flow
        ModuleData memory moduleDataFlowStop = ModuleData({
            modules: new Module[](2),
            args: new bytes[](1)
        });

        moduleDataFlowStop.modules[0] = Module.TIME;
        moduleDataFlowStop.modules[1] = Module.SINGLE_EXEC;

        moduleDataFlowStop.args[0] = LibAutomate._timeModuleArg(
            block.timestamp + scheduledLifespan,
            scheduledLifespan
        );

        bytes memory execDataFlowStop = abi.encodeWithSelector(
            this.decreaseFlow.selector,
            _superToken,
            msg.sender,
            _receiver,
            newFlowNonce,
            flowRate
        );

        sFlow
        .flowRecord[msg.sender][_superToken][newFlowNonce].taskId = LibAutomate
            ._storageAutomate()
            .gelatoAutobot
            .createTask(
                address(this),
                execDataFlowStop,
                moduleDataFlowStop,
                address(0)
            );

        // 4. finishing
        sFlow.flowNonce[msg.sender][_superToken] += 1;
        sControl.controlNonce[_superToken] += 1;
    }

    function decreaseFlow(
        address _superToken,
        address _sender,
        address _receiver,
        uint256 _nonce,
        int96 _flowRate
    ) external {
        LibAutomate._requireOnlyAutobot();

        LibFlow._decreaseFlow(
            _superToken,
            _sender,
            _receiver,
            _nonce,
            _flowRate
        );
    } // for autobot use // TODO: test frontend no one can call it !!

    function closeFlow(address _superToken, uint256 _nonce) external {
        LibFlow.StorageFlow storage sFlow = LibFlow._storageFlow();

        uint256 minimumEndTimestamp = sFlow
        .flowRecord[msg.sender][_superToken][_nonce].timestampIncrease +
            LibControl._storageControl().minimumLifespan;

        if (block.timestamp < minimumEndTimestamp) revert TooEarly();
        // no need check supertoken valid or not in case it suddenly goes unsupported

        // delete task
        LibAutomate._storageAutomate().gelatoAutobot.cancelTask(
            sFlow.flowRecord[msg.sender][_superToken][_nonce].taskId
        );

        // delete flow
        address receiver = sFlow
        .flowRecord[msg.sender][_superToken][_nonce].receiver;
        uint256 sessionNonce = sFlow
        .flowRecord[msg.sender][_superToken][_nonce].sessionNonce;

        LibFlow._decreaseFlow(
            _superToken,
            msg.sender,
            receiver,
            _nonce,
            LibSession
            ._storageSession()
            .sessionRecord[receiver][_superToken][sessionNonce]
                .effectiveFlowRate
        );
    }

    function depositSuperToken(address _superToken, uint256 _amount) external {
        LibControl._requireSuperTokenSupported(_superToken);
        LibFlow._depositSuperToken(_superToken, _amount);
    }

    function withdrawSuperToken(address _superToken, uint256 _amount) external {
        /**
         * don't need to check if supertoken suppported or not
         * as there may be a chance that a supported supertoken
         * gets removed but there is still user funds in the app
         *
         * in that case, just let user withdraw as will fail anyway if 0 amount
         */
        LibFlow._requireNoActiveFlow(_superToken);

        LibFlow._withdrawSuperToken(_superToken, _amount);
    } // TODO: test

    function getAmountFlowed(
        address _user,
        address _superToken
    ) external view returns (uint256) {
        return LibFlow._getAmountFlowed(_user, _superToken);
    }

    function getValidSafeLifespan(
        address _user,
        address _superToken,
        int96 _flowRate
    ) external view returns (uint256) {
        return LibFlow._getValidSafeLifespan(_user, _superToken, _flowRate);
    } // TODO: not so useful... remove.. ?

    /**
     * use `isViewSessionAllowed` to easily determine if viewer can "join room" or not
     * !! NOT used to determine if can `openFlow` or not...
     */
    function isViewSessionAllowed(
        address _viewer,
        address _broadcaster
    ) external view returns (bool) {
        return LibFlow._isViewSessionAllowed(_viewer, _broadcaster);
    }

    function hasActiveFlow(
        address _user,
        address _superToken
    ) external view returns (bool) {
        return LibFlow._hasActiveFlow(_user, _superToken);
    } // TODO: test

    function getNewFlowNonce(
        address _user,
        address _superToken
    ) external view returns (uint256) {
        return LibFlow._getNewNonce(_user, _superToken);
    } // TODO: test

    function getFlowData(
        address _user,
        address _superToken,
        uint256 _nonce
    )
        external
        view
        returns (address, uint256, uint256, uint256, bytes32, bool)
    {
        return LibFlow._getFlowData(_user, _superToken, _nonce);
    }

    function getDepositUser(
        address _user,
        address _superToken
    ) external view returns (uint256) {
        return LibFlow._getDepositUser(_user, _superToken);
    }

    function getDepositTotal(
        address _superToken
    ) external view returns (uint256) {
        return LibFlow._getDepositTotal(_superToken);
    }
}

// TODO: test - % take mechanism (just reduce flowrate based on % and leave cash in app contract?)
// TODO: give broadcaster to optionally set an automated end date (do after get funding) - one reason to do this is viewer cannot withdraw if bc still live !!
// TODO: emit events throughout (especially session & flow creation) so can track user stats eg: avg duration of flow, avg flow rate, sess vs flow count etc..
// TODO: how to penalize broadcaster if dont end flow
// // TODO: require checks for all fns
