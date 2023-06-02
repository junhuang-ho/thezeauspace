import Decimal from "decimal.js";
import { type BigNumber, ethers } from "ethers";

const EtherFormatted = ({ wei }: { wei: BigNumber }) => {
  const etherDecimalPlaces = 6;

  const ether = ethers.utils.formatEther(wei);

  return <>{new Decimal(ether).toDP(etherDecimalPlaces).toFixed()}</>;
};

export default EtherFormatted;
