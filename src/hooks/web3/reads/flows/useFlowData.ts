import { ethers } from "ethers";

import { type BigNumber } from "ethers";

import { useContractRead, useAccount, type Address } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

const useFlowData = (addressToken: Address, nonce: number) => {
  const { isIdle, addressApp } = useAppStates();
  const { isConnected } = useAuthentication();

  const { address: addressWallet } = useAccount();

  const { data: flowData_ } = useContractRead({
    address: addressApp,
    abi: [
      "function getFlowData(address _user, address _superToken, uint256 _nonce) external view returns (address, uint256, uint256, uint256, bytes32, bool)",
    ],
    functionName: "getFlowData",
    args: [addressWallet, addressToken, nonce],
    enabled: isConnected,
    watch: isConnected && !isIdle,
    select: (data) => {
      if (!data) return;
      return data as [
        Address,
        BigNumber,
        BigNumber,
        BigNumber,
        string,
        boolean
      ];
    },
  });
  const receiver = flowData_ ? flowData_[0] : ethers.constants.AddressZero;
  const sessionNonce = flowData_ ? Number(flowData_[1].toString()) : 0;
  const timestampIncrease = flowData_ ? Number(flowData_[2].toString()) : 0;
  const timestampDecrease = flowData_ ? Number(flowData_[3].toString()) : 0;
  const taskId = flowData_ ? flowData_[4] : ethers.constants.HashZero;
  const isBalanceSettled = flowData_ ? flowData_[5] : false;

  return {
    receiver,
    sessionNonce,
    timestampIncrease,
    timestampDecrease,
    taskId,
    isBalanceSettled,
  };
};

export default useFlowData;
