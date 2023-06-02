//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.9;

import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";

import {LibControl, ContractError} from "./LibControl.sol";
import {LibSession} from "./LibSession.sol";

// import "hardhat/console.sol";

error InsufficientFunds();
error InsufficientLifespan1();
error InsufficientLifespan2();
error InsufficientLifespan3();
error HasActiveFlow();
error InvalidBalance1();
error InvalidBalance2();

library LibFlow {
    using SuperTokenV1Library for ISuperToken;

    bytes32 constant STORAGE_POSITION_FLOW = keccak256("ds.flow");

    struct FlowRecord {
        uint256 controlNonce; // TODO: add to flow test
        address receiver;
        uint256 sessionNonce;
        uint256 timestampIncrease; // timestamp at which viewer opened a flow with bc
        uint256 timestampDecrease; // timestamp at which viewer closed a flow with bc // may be 0
        bytes32 taskId; // decrease flow of viewer to broadcaster
        bool isBalanceSettled;
    }

    struct StorageFlow {
        // mapping(address => mapping(address => uint256)) unsettledFlowNonce; // viewer --> superToken --> nonce (counter) from this nonce count onwards is still unsettled
        mapping(address => mapping(address => uint256)) flowNonce; // viewer --> superToken --> nonce (counter)
        mapping(address => mapping(address => mapping(uint256 => FlowRecord))) flowRecord; // viewer --> superToken --> nonce --> flow record
        //
        mapping(address => mapping(address => uint256)) deposits; // viewer --> superToken --> amount deposit
        mapping(address => uint256) totalDeposits; // superToken --> total amount
    }

    function _storageFlow() internal pure returns (StorageFlow storage s) {
        bytes32 position = STORAGE_POSITION_FLOW;
        assembly {
            s.slot := position
        }
    }

    ///// ------- functions ------ /////

    ///// -------- mains --------- /////

    function _depositSuperToken(address _superToken, uint256 _amount) internal {
        ISuperToken(_superToken).transferFrom(
            msg.sender,
            address(this),
            _amount
        );

        _storageFlow().deposits[msg.sender][_superToken] += _amount;
        _storageFlow().totalDeposits[_superToken] += _amount;
    }

    function _withdrawSuperToken(
        address _superToken,
        uint256 _amount
    ) internal {
        // uint256 amountRemaining = _getEffectiveBalance(msg.sender, _superToken);
        _setRemainingBalance(msg.sender, _superToken); // TODO: test

        uint256 amountRemaining = _storageFlow().deposits[msg.sender][
            _superToken
        ];

        if (amountRemaining < _amount) revert InsufficientFunds();

        _storageFlow().deposits[msg.sender][_superToken] -= _amount;
        _storageFlow().totalDeposits[_superToken] -= _amount;

        ISuperToken(_superToken).transferFrom(
            address(this),
            msg.sender,
            _amount
        );
    }

    ///// ------- requires ------- /////

    function _requireNoActiveFlow(address _superToken) internal view {
        if (_hasActiveFlow(msg.sender, _superToken)) revert HasActiveFlow();
    }

    ///// ------- setters -------- /////

    function _setRemainingBalance(address _user, address _superToken) internal {
        uint256 amountFlowed = _getAmountFlowed(_user, _superToken);

        _storageFlow().deposits[_user][_superToken] -= amountFlowed;
        _storageFlow().totalDeposits[_superToken] -= amountFlowed;

        if (_storageFlow().deposits[_user][_superToken] < 0)
            revert InvalidBalance1(); // should never be run!
        if (_storageFlow().totalDeposits[_superToken] < 0)
            revert InvalidBalance2(); // should never be run!

        uint256 newFlowNonce = _getNewNonce(_user, _superToken);
        if (newFlowNonce > 0)
            _storageFlow()
            .flowRecord[_user][_superToken][newFlowNonce - 1]
                .isBalanceSettled = true; // TODO: change other parts to depend on this instead of check timestamp.. etc
        // this is like, not only your previous session must be non-active, but it must have settled the balance!
    } // TODO: test

    ///// ------- getters -------- /////

    function _getValidSafeLifespan(
        address _user,
        address _superToken,
        int96 _flowRate
    ) internal view returns (uint256) {
        uint256 unsafeLifespan = _storageFlow().deposits[_user][_superToken] /
            uint256(uint96(_flowRate));

        LibControl.StorageControl storage sControl = LibControl
            ._storageControl();

        if (unsafeLifespan < sControl.minimumEndDuration)
            revert InsufficientLifespan1();

        uint256 safeLifespan = unsafeLifespan - sControl.minimumEndDuration;

        if (safeLifespan < sControl.minimumLifespan)
            revert InsufficientLifespan2();

        return safeLifespan;
    }

    /**
     * flowRate         --> 1 sec
     * maximumFlowAmount --> maximumFlowAmount/flowRate [in sec]
     */
    function _getScheduledLifespan(
        address _user,
        address _superToken,
        uint256 _lifespan,
        int96 _flowRate
    ) internal view returns (uint256) {
        uint256 safeLifespan = _getValidSafeLifespan(
            _user,
            _superToken,
            _flowRate
        );

        LibControl.StorageControl storage sControl = LibControl
            ._storageControl();
        if (_lifespan < sControl.minimumEndDuration + sControl.minimumLifespan)
            revert InsufficientLifespan3();

        return _lifespan >= safeLifespan ? safeLifespan : _lifespan;
    }

    function _getAmountFlowed(
        address _user,
        address _superToken
    ) internal view returns (uint256) {
        uint256 amountFlowed;
        uint256 currentNonce = _getCurrentNonce(_user, _superToken);
        (
            address receiver,
            uint256 sessionNonce,
            uint256 timestampIncrease,
            uint256 timestampDecrease,
            ,
            bool isBalanceSettled
        ) = _getFlowData(_user, _superToken, currentNonce);
        (, uint96 flowRate, , uint256 timestampStop) = LibSession
            ._getSessionData(receiver, _superToken, sessionNonce);

        if (isBalanceSettled) {
            amountFlowed = 0;
        } else {
            if (timestampDecrease != 0) {
                amountFlowed =
                    uint256(flowRate) *
                    (timestampDecrease - timestampIncrease);
            } else if (timestampStop != 0) {
                amountFlowed =
                    uint256(flowRate) *
                    (timestampStop - timestampIncrease);
            } else {
                amountFlowed = 0;
            }
        }

        return amountFlowed;
    }

    function _hasActiveFlow(
        address _user,
        address _superToken
    ) internal view returns (bool) {
        uint256 newFlowNonce = _getNewNonce(_user, _superToken);
        if (newFlowNonce > 0) {
            (, , , uint256 timestampStop) = LibSession._getSessionDataFromFlow(
                _user,
                _superToken,
                newFlowNonce - 1
            );

            return
                _storageFlow()
                .flowRecord[_user][_superToken][newFlowNonce - 1]
                    .timestampDecrease ==
                0 &&
                timestampStop == 0;
        }
        return false;
    }

    function _isViewSessionAllowed(
        address _viewer,
        address _broadcaster
    ) internal view returns (bool) {
        (uint256 currentTimestamp, address[] memory superTokens) = LibSession
            ._getCurrentSessionData(_broadcaster);

        if (currentTimestamp == 0 || superTokens.length <= 0) return false;

        for (uint256 i = 0; i < superTokens.length; i++) {
            uint256 activeSessionNonce = LibSession._getCurrentNonce(
                _broadcaster,
                superTokens[i]
            );

            (, , uint256 timestampStart, uint256 timestampStop) = LibSession
                ._getSessionData(
                    _broadcaster,
                    superTokens[i],
                    activeSessionNonce
                );

            if (timestampStart != currentTimestamp) return false;

            if (timestampStop != 0) return false;

            uint256 currentFlowNonce = _getCurrentNonce(
                _viewer,
                superTokens[i]
            );

            (
                address receiver,
                uint256 sessionNonce,
                uint256 timestampIncrease,
                uint256 timestampDecrease,
                ,

            ) = _getFlowData(_viewer, superTokens[i], currentFlowNonce);

            if (receiver != _broadcaster) return false;

            if (sessionNonce != activeSessionNonce) return false;

            if (timestampIncrease < currentTimestamp) return false;

            if (timestampDecrease != 0) return false;
        }

        return true;
    }

    function _getNewNonce(
        address _user,
        address _superToken
    ) internal view returns (uint256) {
        return _storageFlow().flowNonce[_user][_superToken];
    }

    function _getCurrentNonce(
        address _user,
        address _superToken
    ) internal view returns (uint256) {
        uint256 nonce = _storageFlow().flowNonce[_user][_superToken];
        return nonce == 0 ? 0 : nonce - 1;
    }

    function _getFlowData(
        address _user,
        address _superToken,
        uint256 _nonce
    )
        internal
        view
        returns (address, uint256, uint256, uint256, bytes32, bool)
    {
        return (
            _storageFlow().flowRecord[_user][_superToken][_nonce].receiver,
            _storageFlow().flowRecord[_user][_superToken][_nonce].sessionNonce,
            _storageFlow()
            .flowRecord[_user][_superToken][_nonce].timestampIncrease,
            _storageFlow()
            .flowRecord[_user][_superToken][_nonce].timestampDecrease,
            _storageFlow().flowRecord[_user][_superToken][_nonce].taskId,
            _storageFlow()
            .flowRecord[_user][_superToken][_nonce].isBalanceSettled
        );
    }

    function _getDepositUser(
        address _user,
        address _superToken
    ) internal view returns (uint256) {
        return _storageFlow().deposits[_user][_superToken];
    }

    function _getDepositTotal(
        address _superToken
    ) internal view returns (uint256) {
        return _storageFlow().totalDeposits[_superToken];
    }

    ///// -------- utils --------- /////

    function _increaseFlow(
        address _superToken,
        address _sender,
        address _receiver,
        uint256 _nonce,
        int96 _flowRate
    ) internal {
        ISuperToken iSuperToken = ISuperToken(_superToken);
        int96 flowRate = iSuperToken.getFlowRate(address(this), _receiver);

        if (flowRate <= 0) {
            iSuperToken.createFlow(_receiver, _flowRate);
        } else {
            iSuperToken.updateFlow(_receiver, flowRate + _flowRate);
        }

        _storageFlow()
        .flowRecord[_sender][_superToken][_nonce].timestampIncrease = block
            .timestamp;
    }

    function _decreaseFlow(
        address _superToken,
        address _sender,
        address _receiver,
        uint256 _nonce,
        int96 _flowRate
    ) internal {
        ISuperToken iSuperToken = ISuperToken(_superToken);
        int96 flowRate = iSuperToken.getFlowRate(address(this), _receiver);

        if (flowRate - _flowRate <= 0) {
            iSuperToken.deleteFlow(address(this), _receiver);
        } else {
            iSuperToken.updateFlow(_receiver, flowRate - _flowRate);
        }

        _storageFlow()
        .flowRecord[_sender][_superToken][_nonce].timestampDecrease = block
            .timestamp;

        uint256 controlNonce = _storageFlow()
        .flowRecord[_sender][_superToken][_nonce].controlNonce;
        LibControl
        ._storageControl()
        .controlRecord[_superToken][controlNonce].timestampDecrease = block
            .timestamp;
    }
}

// TODO: a way to compute effective viewer balance without needing to withdraw (after funding)
// TODO: (after funding) emit event in the "withdraw fn" of "ControlRecord"
