/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../../common";

export interface ControlInterface extends utils.Interface {
  functions: {
    "addSuperToken(address)": FunctionFragment;
    "clearBPS()": FunctionFragment;
    "depositAsset(address,uint256)": FunctionFragment;
    "getAssetTotal(address)": FunctionFragment;
    "getAssetUser(address,address)": FunctionFragment;
    "getBPSData(uint256)": FunctionFragment;
    "getBPSSize()": FunctionFragment;
    "getControlData(address,uint256)": FunctionFragment;
    "getFeeBalance(address)": FunctionFragment;
    "getMinimumEndDuration()": FunctionFragment;
    "getMinimumLifespan()": FunctionFragment;
    "getNewBufferedAppBalance(address,int96)": FunctionFragment;
    "getNewControlNonce(address)": FunctionFragment;
    "getSBPS(address)": FunctionFragment;
    "getSTBufferDurationInSecond()": FunctionFragment;
    "isBPSEnabled()": FunctionFragment;
    "isNewFlowRateAllowed(address,int96)": FunctionFragment;
    "isSuperTokensSupported(address)": FunctionFragment;
    "realizeFeeBalance(uint256,address)": FunctionFragment;
    "removeSuperToken(address)": FunctionFragment;
    "setBPS(uint16[],uint96[],uint96[],uint256[])": FunctionFragment;
    "setMinimumEndDuration(uint256)": FunctionFragment;
    "setMinimumLifespan(uint256)": FunctionFragment;
    "setSBPS(uint16,address)": FunctionFragment;
    "setSTBufferAmount(uint256)": FunctionFragment;
    "toggleBPS()": FunctionFragment;
    "withdrawAsset(address,uint256)": FunctionFragment;
    "withdrawFeeBalance(address,uint256)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "addSuperToken"
      | "clearBPS"
      | "depositAsset"
      | "getAssetTotal"
      | "getAssetUser"
      | "getBPSData"
      | "getBPSSize"
      | "getControlData"
      | "getFeeBalance"
      | "getMinimumEndDuration"
      | "getMinimumLifespan"
      | "getNewBufferedAppBalance"
      | "getNewControlNonce"
      | "getSBPS"
      | "getSTBufferDurationInSecond"
      | "isBPSEnabled"
      | "isNewFlowRateAllowed"
      | "isSuperTokensSupported"
      | "realizeFeeBalance"
      | "removeSuperToken"
      | "setBPS"
      | "setMinimumEndDuration"
      | "setMinimumLifespan"
      | "setSBPS"
      | "setSTBufferAmount"
      | "toggleBPS"
      | "withdrawAsset"
      | "withdrawFeeBalance"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "addSuperToken",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(functionFragment: "clearBPS", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "depositAsset",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getAssetTotal",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getAssetUser",
    values: [PromiseOrValue<string>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getBPSData",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getBPSSize",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getControlData",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getFeeBalance",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getMinimumEndDuration",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getMinimumLifespan",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getNewBufferedAppBalance",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getNewControlNonce",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getSBPS",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getSTBufferDurationInSecond",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "isBPSEnabled",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "isNewFlowRateAllowed",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "isSuperTokensSupported",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "realizeFeeBalance",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "removeSuperToken",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "setBPS",
    values: [
      PromiseOrValue<BigNumberish>[],
      PromiseOrValue<BigNumberish>[],
      PromiseOrValue<BigNumberish>[],
      PromiseOrValue<BigNumberish>[]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "setMinimumEndDuration",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "setMinimumLifespan",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "setSBPS",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "setSTBufferAmount",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(functionFragment: "toggleBPS", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "withdrawAsset",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "withdrawFeeBalance",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;

  decodeFunctionResult(
    functionFragment: "addSuperToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "clearBPS", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "depositAsset",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAssetTotal",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAssetUser",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getBPSData", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getBPSSize", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getControlData",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getFeeBalance",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getMinimumEndDuration",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getMinimumLifespan",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getNewBufferedAppBalance",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getNewControlNonce",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getSBPS", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getSTBufferDurationInSecond",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isBPSEnabled",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isNewFlowRateAllowed",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isSuperTokensSupported",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "realizeFeeBalance",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "removeSuperToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "setBPS", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setMinimumEndDuration",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setMinimumLifespan",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "setSBPS", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setSTBufferAmount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "toggleBPS", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "withdrawAsset",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "withdrawFeeBalance",
    data: BytesLike
  ): Result;

  events: {};
}

export interface Control extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ControlInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    addSuperToken(
      _superToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    clearBPS(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    depositAsset(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    getAssetTotal(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getAssetUser(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getBPSData(
      _tag: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[number, BigNumber, BigNumber]>;

    getBPSSize(overrides?: CallOverrides): Promise<[BigNumber]>;

    getControlData(
      _superToken: PromiseOrValue<string>,
      _nonce: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string, BigNumber, BigNumber, BigNumber]>;

    getFeeBalance(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getMinimumEndDuration(overrides?: CallOverrides): Promise<[BigNumber]>;

    getMinimumLifespan(overrides?: CallOverrides): Promise<[BigNumber]>;

    getNewBufferedAppBalance(
      _superToken: PromiseOrValue<string>,
      _newFlowRate: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getNewControlNonce(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getSBPS(
      _user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[number]>;

    getSTBufferDurationInSecond(
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    isBPSEnabled(overrides?: CallOverrides): Promise<[boolean]>;

    isNewFlowRateAllowed(
      _superToken: PromiseOrValue<string>,
      _newFlowRate: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    isSuperTokensSupported(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    realizeFeeBalance(
      count: PromiseOrValue<BigNumberish>,
      _superToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    removeSuperToken(
      _superToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setBPS(
      _bpss: PromiseOrValue<BigNumberish>[],
      _flowRateLowerBounds: PromiseOrValue<BigNumberish>[],
      _flowRateUpperBounds: PromiseOrValue<BigNumberish>[],
      _tags: PromiseOrValue<BigNumberish>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setMinimumEndDuration(
      _duration: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setMinimumLifespan(
      _duration: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setSBPS(
      _bps: PromiseOrValue<BigNumberish>,
      _user: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setSTBufferAmount(
      _duration: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    toggleBPS(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    withdrawAsset(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    withdrawFeeBalance(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  addSuperToken(
    _superToken: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  clearBPS(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  depositAsset(
    _superToken: PromiseOrValue<string>,
    _amount: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  getAssetTotal(
    _superToken: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getAssetUser(
    _user: PromiseOrValue<string>,
    _superToken: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getBPSData(
    _tag: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<[number, BigNumber, BigNumber]>;

  getBPSSize(overrides?: CallOverrides): Promise<BigNumber>;

  getControlData(
    _superToken: PromiseOrValue<string>,
    _nonce: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<[string, BigNumber, BigNumber, BigNumber]>;

  getFeeBalance(
    _superToken: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getMinimumEndDuration(overrides?: CallOverrides): Promise<BigNumber>;

  getMinimumLifespan(overrides?: CallOverrides): Promise<BigNumber>;

  getNewBufferedAppBalance(
    _superToken: PromiseOrValue<string>,
    _newFlowRate: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getNewControlNonce(
    _superToken: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getSBPS(
    _user: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<number>;

  getSTBufferDurationInSecond(overrides?: CallOverrides): Promise<BigNumber>;

  isBPSEnabled(overrides?: CallOverrides): Promise<boolean>;

  isNewFlowRateAllowed(
    _superToken: PromiseOrValue<string>,
    _newFlowRate: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  isSuperTokensSupported(
    _superToken: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  realizeFeeBalance(
    count: PromiseOrValue<BigNumberish>,
    _superToken: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  removeSuperToken(
    _superToken: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setBPS(
    _bpss: PromiseOrValue<BigNumberish>[],
    _flowRateLowerBounds: PromiseOrValue<BigNumberish>[],
    _flowRateUpperBounds: PromiseOrValue<BigNumberish>[],
    _tags: PromiseOrValue<BigNumberish>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setMinimumEndDuration(
    _duration: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setMinimumLifespan(
    _duration: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setSBPS(
    _bps: PromiseOrValue<BigNumberish>,
    _user: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setSTBufferAmount(
    _duration: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  toggleBPS(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  withdrawAsset(
    _superToken: PromiseOrValue<string>,
    _amount: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  withdrawFeeBalance(
    _superToken: PromiseOrValue<string>,
    _amount: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    addSuperToken(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    clearBPS(overrides?: CallOverrides): Promise<void>;

    depositAsset(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    getAssetTotal(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getAssetUser(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getBPSData(
      _tag: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[number, BigNumber, BigNumber]>;

    getBPSSize(overrides?: CallOverrides): Promise<BigNumber>;

    getControlData(
      _superToken: PromiseOrValue<string>,
      _nonce: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string, BigNumber, BigNumber, BigNumber]>;

    getFeeBalance(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getMinimumEndDuration(overrides?: CallOverrides): Promise<BigNumber>;

    getMinimumLifespan(overrides?: CallOverrides): Promise<BigNumber>;

    getNewBufferedAppBalance(
      _superToken: PromiseOrValue<string>,
      _newFlowRate: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getNewControlNonce(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getSBPS(
      _user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<number>;

    getSTBufferDurationInSecond(overrides?: CallOverrides): Promise<BigNumber>;

    isBPSEnabled(overrides?: CallOverrides): Promise<boolean>;

    isNewFlowRateAllowed(
      _superToken: PromiseOrValue<string>,
      _newFlowRate: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    isSuperTokensSupported(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    realizeFeeBalance(
      count: PromiseOrValue<BigNumberish>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    removeSuperToken(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    setBPS(
      _bpss: PromiseOrValue<BigNumberish>[],
      _flowRateLowerBounds: PromiseOrValue<BigNumberish>[],
      _flowRateUpperBounds: PromiseOrValue<BigNumberish>[],
      _tags: PromiseOrValue<BigNumberish>[],
      overrides?: CallOverrides
    ): Promise<void>;

    setMinimumEndDuration(
      _duration: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    setMinimumLifespan(
      _duration: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    setSBPS(
      _bps: PromiseOrValue<BigNumberish>,
      _user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    setSTBufferAmount(
      _duration: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    toggleBPS(overrides?: CallOverrides): Promise<void>;

    withdrawAsset(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    withdrawFeeBalance(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    addSuperToken(
      _superToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    clearBPS(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    depositAsset(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    getAssetTotal(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getAssetUser(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getBPSData(
      _tag: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getBPSSize(overrides?: CallOverrides): Promise<BigNumber>;

    getControlData(
      _superToken: PromiseOrValue<string>,
      _nonce: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getFeeBalance(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getMinimumEndDuration(overrides?: CallOverrides): Promise<BigNumber>;

    getMinimumLifespan(overrides?: CallOverrides): Promise<BigNumber>;

    getNewBufferedAppBalance(
      _superToken: PromiseOrValue<string>,
      _newFlowRate: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getNewControlNonce(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getSBPS(
      _user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getSTBufferDurationInSecond(overrides?: CallOverrides): Promise<BigNumber>;

    isBPSEnabled(overrides?: CallOverrides): Promise<BigNumber>;

    isNewFlowRateAllowed(
      _superToken: PromiseOrValue<string>,
      _newFlowRate: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    isSuperTokensSupported(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    realizeFeeBalance(
      count: PromiseOrValue<BigNumberish>,
      _superToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    removeSuperToken(
      _superToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setBPS(
      _bpss: PromiseOrValue<BigNumberish>[],
      _flowRateLowerBounds: PromiseOrValue<BigNumberish>[],
      _flowRateUpperBounds: PromiseOrValue<BigNumberish>[],
      _tags: PromiseOrValue<BigNumberish>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setMinimumEndDuration(
      _duration: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setMinimumLifespan(
      _duration: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setSBPS(
      _bps: PromiseOrValue<BigNumberish>,
      _user: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setSTBufferAmount(
      _duration: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    toggleBPS(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    withdrawAsset(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    withdrawFeeBalance(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    addSuperToken(
      _superToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    clearBPS(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    depositAsset(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    getAssetTotal(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getAssetUser(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getBPSData(
      _tag: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getBPSSize(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getControlData(
      _superToken: PromiseOrValue<string>,
      _nonce: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getFeeBalance(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getMinimumEndDuration(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getMinimumLifespan(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getNewBufferedAppBalance(
      _superToken: PromiseOrValue<string>,
      _newFlowRate: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getNewControlNonce(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getSBPS(
      _user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getSTBufferDurationInSecond(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isBPSEnabled(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    isNewFlowRateAllowed(
      _superToken: PromiseOrValue<string>,
      _newFlowRate: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isSuperTokensSupported(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    realizeFeeBalance(
      count: PromiseOrValue<BigNumberish>,
      _superToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    removeSuperToken(
      _superToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setBPS(
      _bpss: PromiseOrValue<BigNumberish>[],
      _flowRateLowerBounds: PromiseOrValue<BigNumberish>[],
      _flowRateUpperBounds: PromiseOrValue<BigNumberish>[],
      _tags: PromiseOrValue<BigNumberish>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setMinimumEndDuration(
      _duration: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setMinimumLifespan(
      _duration: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setSBPS(
      _bps: PromiseOrValue<BigNumberish>,
      _user: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setSTBufferAmount(
      _duration: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    toggleBPS(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    withdrawAsset(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    withdrawFeeBalance(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
