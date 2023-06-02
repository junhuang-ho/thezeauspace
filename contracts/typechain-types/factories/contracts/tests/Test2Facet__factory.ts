/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type {
  Test2Facet,
  Test2FacetInterface,
} from "../../../contracts/tests/Test2Facet";

const _abi = [
  {
    inputs: [],
    name: "test2Func1",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func10",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func11",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func12",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func13",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func14",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func15",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func16",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func17",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func18",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func19",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func2",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func20",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func3",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func4",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func5",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func6",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func7",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func8",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "test2Func9",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b50610257806100206000396000f3fe608060405234801561001057600080fd5b506004361061012c5760003560e01c80638ee8be30116100ad578063d2f0c73e11610071578063d2f0c73e146101c7578063e5f687b2146101d1578063e7de23a4146101db578063ea36b558146101e5578063ef3f4d78146101ef5761012c565b80638ee8be301461019557806391d0396b1461019f578063c670641d146101a9578063ca5fa5c0146101b3578063caae8f23146101bd5761012c565b80632e463958116100f45780632e463958146101635780635fd6312b1461016d5780636dc16b0114610177578063792a8e2e14610181578063884280a61461018b5761012c565b806303feeeae146101315780630c103a931461013b5780630e4cd7fc14610145578063148843091461014f57806317fd06e714610159575b600080fd5b6101396101f9565b005b6101436101fb565b005b61014d6101fd565b005b6101576101ff565b005b610161610201565b005b61016b610203565b005b610175610205565b005b61017f610207565b005b610189610209565b005b61019361020b565b005b61019d61020d565b005b6101a761020f565b005b6101b1610211565b005b6101bb610213565b005b6101c5610215565b005b6101cf610217565b005b6101d9610219565b005b6101e361021b565b005b6101ed61021d565b005b6101f761021f565b005b565b565b565b565b565b565b565b565b565b565b565b565b565b565b565b565b565b565b565b56fea2646970667358221220827357bb518fcc14f1fbc8cdb66f483c3780416f08a3fb2ca2505df5b7c68ba864736f6c63430008120033";

type Test2FacetConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: Test2FacetConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Test2Facet__factory extends ContractFactory {
  constructor(...args: Test2FacetConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<Test2Facet> {
    return super.deploy(overrides || {}) as Promise<Test2Facet>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): Test2Facet {
    return super.attach(address) as Test2Facet;
  }
  override connect(signer: Signer): Test2Facet__factory {
    return super.connect(signer) as Test2Facet__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): Test2FacetInterface {
    return new utils.Interface(_abi) as Test2FacetInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Test2Facet {
    return new Contract(address, _abi, signerOrProvider) as Test2Facet;
  }
}
