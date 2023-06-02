import { useEffect, useMemo, useState } from "react";
import { type BigNumber, ethers } from "ethers";
import EtherFormatted from "./EtherFormatted";

const ANIMATION_MINIMUM_STEP_TIME = 80;

export interface FlowingBalanceProps {
  balance: BigNumber;
  balanceTimestamp: number; // Timestamp in Subgraph's UTC.
  flowRate: BigNumber;
}

const FlowingBalance = ({
  balance,
  balanceTimestamp,
  flowRate,
}: FlowingBalanceProps) => {
  const [weiValue, setWeiValue] = useState<BigNumber>(balance);
  useEffect(() => setWeiValue(balance), [balance]);

  const balanceTimestampMs = useMemo(
    () => ethers.BigNumber.from(balanceTimestamp).mul(1000),
    [balanceTimestamp]
  );

  useEffect(() => {
    // const flowRateBigNumber = ethers.BigNumber.from(flowRate);
    if (flowRate.isZero()) {
      return; // No need to show animation when flow rate is zero.
    }

    const balanceBigNumber = ethers.BigNumber.from(balance);

    let stopAnimation = false;
    let lastAnimationTimestamp: DOMHighResTimeStamp = 0;

    const animationStep = (currentAnimationTimestamp: DOMHighResTimeStamp) => {
      if (stopAnimation) {
        return;
      }

      if (
        currentAnimationTimestamp - lastAnimationTimestamp >
        ANIMATION_MINIMUM_STEP_TIME
      ) {
        const currentTimestampBigNumber = ethers.BigNumber.from(
          new Date().valueOf() // Milliseconds elapsed since UTC epoch, disregards timezone.
        );

        setWeiValue(
          balanceBigNumber.add(
            currentTimestampBigNumber
              .sub(balanceTimestampMs)
              .mul(flowRate)
              .div(1000)
          )
        );

        lastAnimationTimestamp = currentAnimationTimestamp;
      }

      window.requestAnimationFrame(animationStep);
    };

    window.requestAnimationFrame(animationStep);

    return () => {
      stopAnimation = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, balanceTimestamp, flowRate]);

  return <EtherFormatted wei={weiValue} />;
};

export default FlowingBalance;
