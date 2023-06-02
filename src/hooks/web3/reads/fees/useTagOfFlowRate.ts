import { type BigNumber } from "ethers";

import { useContractReads, type Address } from "wagmi";
import { useState, useEffect } from "react";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";
import useFeeSize from "./useFeeSize";
import useIsFeeEnabled from "./useIsFeeEnabled";

import { type Quality } from "~/constants/common";

type ReadArgs = {
  address: Address;
  abi: string[];
  functionName: string;
  args: any[];
};

const useTagOfFlowRate = (flowRate: BigNumber, quality: Quality) => {
  const { addressApp } = useAppStates();
  const { isConnected } = useAuthentication();

  const { isFeeEnabled } = useIsFeeEnabled();
  const { feeSize } = useFeeSize();

  const [inputs, setInputs] = useState<ReadArgs[]>([]);
  useEffect(() => {
    const setInputs_ = (feeSize: number) => {
      if (!isFeeEnabled) return;
      const readInputs: ReadArgs[] = [];
      for (let i = 0; i < feeSize; i++) {
        readInputs.push({
          address: addressApp,
          abi: [
            "function getBPSData(uint256 _tag) external view returns (uint16, uint96, uint96)",
          ],
          functionName: "getBPSData",
          args: [i],
        });
      } // NOTE: loop depends on BPS being in-order WITHOUT any integer being skipped
      setInputs(readInputs);
    };
    setInputs_(feeSize);
  }, [isFeeEnabled, feeSize, addressApp]);

  const { data: tag_ } = useContractReads({
    contracts: inputs,
    enabled: isConnected && isFeeEnabled && inputs.length > 0,
    select: (data) => {
      if (!data) return;
      const data_ = data as [number, BigNumber, BigNumber][];

      let dataSlice;
      if (quality === "1080p") {
        // TODO: make "1080p" a constant
        dataSlice = data_.slice(6);
      } else {
        dataSlice = data_.slice(0, 6);
      }

      for (let i = 0; i < dataSlice.length; i++) {
        // eslint-disable-next-line
        const flowRateLowerBound = dataSlice[i]?.[1]!;
        // eslint-disable-next-line
        const flowRateUpperBound = dataSlice[i]?.[2]!;
        if (
          flowRate.gte(flowRateLowerBound) &&
          flowRate.lt(flowRateUpperBound)
        ) {
          // eslint-disable-next-line
          return dataSlice[i]?.[0]!;
        }
      }
    },
  });

  const tag = isFeeEnabled ? tag_ : 0; // if fee not enabled, then just return 0 as contract won't process the tag value
  const isValidTag = !isFeeEnabled || (isFeeEnabled && tag !== undefined);

  return { tag, isValidTag };
};

export default useTagOfFlowRate;
