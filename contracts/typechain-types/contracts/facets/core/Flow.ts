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

export interface FlowInterface extends utils.Interface {
  functions: {
    "closeFlow(address,uint256)": FunctionFragment;
    "decreaseFlow(address,address,address,uint256,int96)": FunctionFragment;
    "depositSuperToken(address,uint256)": FunctionFragment;
    "getAmountFlowed(address,address)": FunctionFragment;
    "getDepositTotal(address)": FunctionFragment;
    "getDepositUser(address,address)": FunctionFragment;
    "getFlowData(address,address,uint256)": FunctionFragment;
    "getNewFlowNonce(address,address)": FunctionFragment;
    "getValidSafeLifespan(address,address,int96)": FunctionFragment;
    "hasActiveFlow(address,address)": FunctionFragment;
    "isViewSessionAllowed(address,address)": FunctionFragment;
    "openFlow(address,address,uint256)": FunctionFragment;
    "withdrawSuperToken(address,uint256)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "closeFlow"
      | "decreaseFlow"
      | "depositSuperToken"
      | "getAmountFlowed"
      | "getDepositTotal"
      | "getDepositUser"
      | "getFlowData"
      | "getNewFlowNonce"
      | "getValidSafeLifespan"
      | "hasActiveFlow"
      | "isViewSessionAllowed"
      | "openFlow"
      | "withdrawSuperToken"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "closeFlow",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "decreaseFlow",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "depositSuperToken",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getAmountFlowed",
    values: [PromiseOrValue<string>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getDepositTotal",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getDepositUser",
    values: [PromiseOrValue<string>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getFlowData",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "getNewFlowNonce",
    values: [PromiseOrValue<string>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getValidSafeLifespan",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "hasActiveFlow",
    values: [PromiseOrValue<string>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "isViewSessionAllowed",
    values: [PromiseOrValue<string>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "openFlow",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "withdrawSuperToken",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;

  decodeFunctionResult(functionFragment: "closeFlow", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "decreaseFlow",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "depositSuperToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAmountFlowed",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getDepositTotal",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getDepositUser",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getFlowData",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getNewFlowNonce",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getValidSafeLifespan",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "hasActiveFlow",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isViewSessionAllowed",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "openFlow", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "withdrawSuperToken",
    data: BytesLike
  ): Result;

  events: {};
}

export interface Flow extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: FlowInterface;

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
    closeFlow(
      _superToken: PromiseOrValue<string>,
      _nonce: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    decreaseFlow(
      _superToken: PromiseOrValue<string>,
      _sender: PromiseOrValue<string>,
      _receiver: PromiseOrValue<string>,
      _nonce: PromiseOrValue<BigNumberish>,
      _flowRate: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    depositSuperToken(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    getAmountFlowed(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getDepositTotal(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getDepositUser(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getFlowData(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      _nonce: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string, BigNumber, BigNumber, BigNumber, string, boolean]>;

    getNewFlowNonce(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getValidSafeLifespan(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      _flowRate: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    hasActiveFlow(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    isViewSessionAllowed(
      _viewer: PromiseOrValue<string>,
      _broadcaster: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    openFlow(
      _receiver: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      _lifespan: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    withdrawSuperToken(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  closeFlow(
    _superToken: PromiseOrValue<string>,
    _nonce: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  decreaseFlow(
    _superToken: PromiseOrValue<string>,
    _sender: PromiseOrValue<string>,
    _receiver: PromiseOrValue<string>,
    _nonce: PromiseOrValue<BigNumberish>,
    _flowRate: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  depositSuperToken(
    _superToken: PromiseOrValue<string>,
    _amount: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  getAmountFlowed(
    _user: PromiseOrValue<string>,
    _superToken: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getDepositTotal(
    _superToken: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getDepositUser(
    _user: PromiseOrValue<string>,
    _superToken: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getFlowData(
    _user: PromiseOrValue<string>,
    _superToken: PromiseOrValue<string>,
    _nonce: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<[string, BigNumber, BigNumber, BigNumber, string, boolean]>;

  getNewFlowNonce(
    _user: PromiseOrValue<string>,
    _superToken: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getValidSafeLifespan(
    _user: PromiseOrValue<string>,
    _superToken: PromiseOrValue<string>,
    _flowRate: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  hasActiveFlow(
    _user: PromiseOrValue<string>,
    _superToken: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  isViewSessionAllowed(
    _viewer: PromiseOrValue<string>,
    _broadcaster: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  openFlow(
    _receiver: PromiseOrValue<string>,
    _superToken: PromiseOrValue<string>,
    _lifespan: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  withdrawSuperToken(
    _superToken: PromiseOrValue<string>,
    _amount: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    closeFlow(
      _superToken: PromiseOrValue<string>,
      _nonce: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    decreaseFlow(
      _superToken: PromiseOrValue<string>,
      _sender: PromiseOrValue<string>,
      _receiver: PromiseOrValue<string>,
      _nonce: PromiseOrValue<BigNumberish>,
      _flowRate: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    depositSuperToken(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    getAmountFlowed(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getDepositTotal(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getDepositUser(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getFlowData(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      _nonce: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string, BigNumber, BigNumber, BigNumber, string, boolean]>;

    getNewFlowNonce(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getValidSafeLifespan(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      _flowRate: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    hasActiveFlow(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    isViewSessionAllowed(
      _viewer: PromiseOrValue<string>,
      _broadcaster: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    openFlow(
      _receiver: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      _lifespan: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    withdrawSuperToken(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    closeFlow(
      _superToken: PromiseOrValue<string>,
      _nonce: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    decreaseFlow(
      _superToken: PromiseOrValue<string>,
      _sender: PromiseOrValue<string>,
      _receiver: PromiseOrValue<string>,
      _nonce: PromiseOrValue<BigNumberish>,
      _flowRate: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    depositSuperToken(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    getAmountFlowed(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getDepositTotal(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getDepositUser(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getFlowData(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      _nonce: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getNewFlowNonce(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getValidSafeLifespan(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      _flowRate: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    hasActiveFlow(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    isViewSessionAllowed(
      _viewer: PromiseOrValue<string>,
      _broadcaster: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    openFlow(
      _receiver: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      _lifespan: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    withdrawSuperToken(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    closeFlow(
      _superToken: PromiseOrValue<string>,
      _nonce: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    decreaseFlow(
      _superToken: PromiseOrValue<string>,
      _sender: PromiseOrValue<string>,
      _receiver: PromiseOrValue<string>,
      _nonce: PromiseOrValue<BigNumberish>,
      _flowRate: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    depositSuperToken(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    getAmountFlowed(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getDepositTotal(
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getDepositUser(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getFlowData(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      _nonce: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getNewFlowNonce(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getValidSafeLifespan(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      _flowRate: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    hasActiveFlow(
      _user: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isViewSessionAllowed(
      _viewer: PromiseOrValue<string>,
      _broadcaster: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    openFlow(
      _receiver: PromiseOrValue<string>,
      _superToken: PromiseOrValue<string>,
      _lifespan: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    withdrawSuperToken(
      _superToken: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
