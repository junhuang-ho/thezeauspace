// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.9;

import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import {LibDiamond} from "../libraries/utils/LibDiamond.sol";
import {LibAutomate} from "../libraries/core/LibAutomate.sol";
import {LibControl} from "../libraries/core/LibControl.sol";
import {IERC165} from "../interfaces/utils/IERC165.sol";
import {ICut} from "../interfaces/utils/ICut.sol";
import {ILoupe} from "../interfaces/utils/ILoupe.sol";
import {IAccessControl} from "../interfaces/utils/IAccessControl.sol";
import {IUtility} from "../interfaces/utils/IUtility.sol";
import {IAutomate} from "../interfaces/core/IAutomate.sol";
import {IControl} from "../interfaces/core/IControl.sol";
import {ISession} from "../interfaces/core/ISession.sol";
import {IFlow} from "../interfaces/core/IFlow.sol";

contract DiamondInit {
    function init(
        address _autobot,
        uint256 _minimumAppGelatoBalance,
        uint256 _minimumEndDuration, // seconds
        uint256 _minimumLifespan, // seconds
        uint256 _stBufferDurationInSecond,
        address[] memory _superTokens
    ) external {
        LibDiamond.StorageDiamond storage s = LibDiamond._storageDiamond();
        s.supportedInterfaces[type(IERC165).interfaceId] = true;
        s.supportedInterfaces[type(ICut).interfaceId] = true;
        s.supportedInterfaces[type(ILoupe).interfaceId] = true;
        s.supportedInterfaces[type(IAccessControl).interfaceId] = true;
        s.supportedInterfaces[type(IUtility).interfaceId] = true;
        s.supportedInterfaces[type(IAutomate).interfaceId] = true;
        s.supportedInterfaces[type(IControl).interfaceId] = true;
        s.supportedInterfaces[type(ISession).interfaceId] = true;
        s.supportedInterfaces[type(IFlow).interfaceId] = true;

        LibAutomate._setGelatoContracts(_autobot);
        LibAutomate._setMinimumAppGelatoBalance(_minimumAppGelatoBalance);
        LibControl._setMinimumEndDuration(_minimumEndDuration);
        LibControl._setMinimumLifespan(_minimumLifespan);
        LibControl._setSTBufferAmount(_stBufferDurationInSecond);
        for (uint256 i = 0; i < _superTokens.length; i++) {
            LibControl._addSuperToken(_superTokens[i]);
        }
    }
}
