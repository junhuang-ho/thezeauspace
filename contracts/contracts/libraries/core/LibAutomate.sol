//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../../services/gelato/Types.sol";

// gelato based

error InsufficientAppGelatoBalance();
error CallerNotAutobot();

library LibAutomate {
    using SafeERC20 for IERC20;

    bytes32 constant STORAGE_POSITION_AUTOMATE = keccak256("ds.automate");
    address internal constant AUTOBOT_PROXY_FACTORY =
        0xC815dB16D4be6ddf2685C201937905aBf338F5D7;
    address internal constant GELATO_FEE =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    struct StorageAutomate {
        IAutomate gelatoAutobot;
        ITaskTreasuryUpgradable gelatoTreasury;
        address gelatoNetwork;
        uint256 minimumAppGelatoBalance;
    }

    function _storageAutomate()
        internal
        pure
        returns (StorageAutomate storage s)
    {
        bytes32 position = STORAGE_POSITION_AUTOMATE;
        assembly {
            s.slot := position
        }
    }

    ///// ------- functions ------ /////

    ///// -------- mains --------- /////

    function _withdrawGelatoFunds(uint256 _amount) internal {
        _storageAutomate().gelatoTreasury.withdrawFunds(
            payable(msg.sender),
            GELATO_FEE,
            _amount
        );
    } // withdrawer address restriction set in facet

    function _depositGelatoFunds(uint256 _amount) internal {
        _storageAutomate().gelatoTreasury.depositFunds{value: _amount}(
            address(this), // address(this) = address of diamond
            GELATO_FEE,
            _amount
        );
    }

    function _getModuleData(
        uint256 _durationStart,
        uint256 _durationInterval
    ) internal view returns (ModuleData memory) {
        ModuleData memory moduleData = ModuleData({
            modules: new Module[](2),
            args: new bytes[](1)
        });

        moduleData.modules[0] = Module.TIME;
        moduleData.modules[1] = Module.SINGLE_EXEC;

        moduleData.args[0] = _timeModuleArg(
            block.timestamp + _durationStart,
            _durationInterval
        );

        return moduleData;
    }

    function _transfer(uint256 _fee, address _feeToken) internal {
        if (_feeToken == GELATO_FEE) {
            (bool success, ) = _storageAutomate().gelatoNetwork.call{
                value: _fee
            }("");
            require(success, "LibAutomate: _transfer failed");
        } else {
            SafeERC20.safeTransfer(
                IERC20(_feeToken),
                _storageAutomate().gelatoNetwork,
                _fee
            );
        }
    }

    function _getFeeDetails()
        internal
        view
        returns (uint256 fee, address feeToken)
    {
        (fee, feeToken) = _storageAutomate().gelatoAutobot.getFeeDetails();
    }

    ///// ------- requires ------- /////

    function _requireOnlyAutobot() internal view {
        if (msg.sender != address(_storageAutomate().gelatoAutobot))
            revert CallerNotAutobot();
    }

    function _requireSufficientAppGelatoBalance() internal view {
        if (
            _getAppGelatoBalance() <= _storageAutomate().minimumAppGelatoBalance
        ) revert InsufficientAppGelatoBalance();
    }

    ///// ------- setters -------- /////

    function _setGelatoContracts(address _autobot) internal {
        _storageAutomate().gelatoAutobot = IAutomate(_autobot);
        _storageAutomate().gelatoNetwork = IAutomate(_autobot).gelato();
        _storageAutomate().gelatoTreasury = _storageAutomate()
            .gelatoAutobot
            .taskTreasury();
    }

    function _setMinimumAppGelatoBalance(uint256 _value) internal {
        _storageAutomate().minimumAppGelatoBalance = _value;
    }

    ///// ------- getters -------- /////

    function _getGelatoAddresses()
        internal
        view
        returns (address, address, address, address, address)
    {
        return (
            address(_storageAutomate().gelatoAutobot),
            address(_storageAutomate().gelatoTreasury),
            _storageAutomate().gelatoNetwork,
            AUTOBOT_PROXY_FACTORY,
            GELATO_FEE
        );
    }

    function _getMinimumAppGelatoBalance() internal view returns (uint256) {
        return _storageAutomate().minimumAppGelatoBalance;
    }

    function _getAppGelatoBalance() internal view returns (uint256) {
        return
            _storageAutomate().gelatoTreasury.userTokenBalance(
                address(this),
                GELATO_FEE
            );
    }

    ///// -------- utils --------- /////

    function _resolverModuleArg(
        address _resolverAddress,
        bytes memory _resolverData
    ) internal pure returns (bytes memory) {
        return abi.encode(_resolverAddress, _resolverData);
    }

    function _timeModuleArg(
        uint256 _startTime,
        uint256 _interval
    ) internal pure returns (bytes memory) {
        return abi.encode(uint128(_startTime), uint128(_interval));
    }

    function _proxyModuleArg() internal pure returns (bytes memory) {
        return bytes("");
    }

    function _singleExecModuleArg() internal pure returns (bytes memory) {
        return bytes("");
    }
}
