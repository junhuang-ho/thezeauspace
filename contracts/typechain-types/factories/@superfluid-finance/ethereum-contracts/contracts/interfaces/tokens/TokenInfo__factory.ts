/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  TokenInfo,
  TokenInfoInterface,
} from "../../../../../../@superfluid-finance/ethereum-contracts/contracts/interfaces/tokens/TokenInfo";

const _abi = [
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export class TokenInfo__factory {
  static readonly abi = _abi;
  static createInterface(): TokenInfoInterface {
    return new utils.Interface(_abi) as TokenInfoInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): TokenInfo {
    return new Contract(address, _abi, signerOrProvider) as TokenInfo;
  }
}
