/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../common";
import type {
  AccessControl,
  AccessControlInterface,
} from "../../../../contracts/facets/utils/AccessControl";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    inputs: [],
    name: "getDefaultAdminRole",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_role",
        type: "string",
      },
    ],
    name: "getRole",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
    ],
    name: "hasRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_role",
        type: "bytes32",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b50610e0f806100206000396000f3fe608060405234801561001057600080fd5b506004361061007d5760003560e01c80636e9067fb1161005b5780636e9067fb146100ec5780638bb9c5bf1461011c57806391d1485414610138578063d547741f146101685761007d565b8063248a9ca3146100825780632f2ff15d146100b257806352a9c8d7146100ce575b600080fd5b61009c600480360381019061009791906107fd565b610184565b6040516100a99190610839565b60405180910390f35b6100cc60048036038101906100c791906108b2565b610196565b005b6100d66101b5565b6040516100e39190610839565b60405180910390f35b61010660048036038101906101019190610a38565b6101c0565b6040516101139190610839565b60405180910390f35b610136600480360381019061013191906107fd565b6101f0565b005b610152600480360381019061014d91906108b2565b6101fd565b60405161015f9190610a9c565b60405180910390f35b610182600480360381019061017d91906108b2565b610211565b005b600061018f82610230565b9050919050565b6101a76101a283610230565b610259565b6101b18282610265565b5050565b60008060001b905090565b6000816040516020016101d39190610b36565b604051602081830303815290604052805190602001209050919050565b6101fa8133610348565b50565b6000610209838361042c565b905092915050565b61022261021d83610230565b610259565b61022c8282610348565b5050565b600061023a6104a0565b6000016000838152602001908152602001600020600101549050919050565b610262816104cd565b50565b61026f828261042c565b61034457600161027d6104a0565b600001600084815260200190815260200160002060000160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055503373ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45b5050565b610352828261042c565b156104285760006103616104a0565b600001600084815260200190815260200160002060000160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055503373ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16837ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b60405160405180910390a45b5050565b60006104366104a0565b600001600084815260200190815260200160002060000160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16905092915050565b6000807f4cd15452b25e815d3f9d1a3c7edd985a178edf5eb3461a1acbf855517423d69490508091505090565b6104d781336104da565b50565b6104e4828261042c565b610573576105098173ffffffffffffffffffffffffffffffffffffffff166014610577565b6105178360001c6020610577565b604051602001610528929190610c2c565b6040516020818303038152906040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161056a9190610b36565b60405180910390fd5b5050565b60606000600283600261058a9190610c9f565b6105949190610ce1565b67ffffffffffffffff8111156105ad576105ac61090d565b5b6040519080825280601f01601f1916602001820160405280156105df5781602001600182028036833780820191505090505b5090507f30000000000000000000000000000000000000000000000000000000000000008160008151811061061757610616610d15565b5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a9053507f78000000000000000000000000000000000000000000000000000000000000008160018151811061067b5761067a610d15565b5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a905350600060018460026106bb9190610c9f565b6106c59190610ce1565b90505b6001811115610765577f3031323334353637383961626364656600000000000000000000000000000000600f86166010811061070757610706610d15565b5b1a60f81b82828151811061071e5761071d610d15565b5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a905350600485901c94508061075e90610d44565b90506106c8565b50600084146107a9576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016107a090610db9565b60405180910390fd5b8091505092915050565b6000604051905090565b600080fd5b600080fd5b6000819050919050565b6107da816107c7565b81146107e557600080fd5b50565b6000813590506107f7816107d1565b92915050565b600060208284031215610813576108126107bd565b5b6000610821848285016107e8565b91505092915050565b610833816107c7565b82525050565b600060208201905061084e600083018461082a565b92915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061087f82610854565b9050919050565b61088f81610874565b811461089a57600080fd5b50565b6000813590506108ac81610886565b92915050565b600080604083850312156108c9576108c86107bd565b5b60006108d7858286016107e8565b92505060206108e88582860161089d565b9150509250929050565b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b610945826108fc565b810181811067ffffffffffffffff821117156109645761096361090d565b5b80604052505050565b60006109776107b3565b9050610983828261093c565b919050565b600067ffffffffffffffff8211156109a3576109a261090d565b5b6109ac826108fc565b9050602081019050919050565b82818337600083830152505050565b60006109db6109d684610988565b61096d565b9050828152602081018484840111156109f7576109f66108f7565b5b610a028482856109b9565b509392505050565b600082601f830112610a1f57610a1e6108f2565b5b8135610a2f8482602086016109c8565b91505092915050565b600060208284031215610a4e57610a4d6107bd565b5b600082013567ffffffffffffffff811115610a6c57610a6b6107c2565b5b610a7884828501610a0a565b91505092915050565b60008115159050919050565b610a9681610a81565b82525050565b6000602082019050610ab16000830184610a8d565b92915050565b600081519050919050565b600082825260208201905092915050565b60005b83811015610af1578082015181840152602081019050610ad6565b60008484015250505050565b6000610b0882610ab7565b610b128185610ac2565b9350610b22818560208601610ad3565b610b2b816108fc565b840191505092915050565b60006020820190508181036000830152610b508184610afd565b905092915050565b600081905092915050565b7f416363657373436f6e74726f6c3a206163636f756e7420000000000000000000600082015250565b6000610b99601783610b58565b9150610ba482610b63565b601782019050919050565b6000610bba82610ab7565b610bc48185610b58565b9350610bd4818560208601610ad3565b80840191505092915050565b7f206973206d697373696e6720726f6c6520000000000000000000000000000000600082015250565b6000610c16601183610b58565b9150610c2182610be0565b601182019050919050565b6000610c3782610b8c565b9150610c438285610baf565b9150610c4e82610c09565b9150610c5a8284610baf565b91508190509392505050565b6000819050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610caa82610c66565b9150610cb583610c66565b9250828202610cc381610c66565b91508282048414831517610cda57610cd9610c70565b5b5092915050565b6000610cec82610c66565b9150610cf783610c66565b9250828201905080821115610d0f57610d0e610c70565b5b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b6000610d4f82610c66565b915060008203610d6257610d61610c70565b5b600182039050919050565b7f537472696e67733a20686578206c656e67746820696e73756666696369656e74600082015250565b6000610da3602083610ac2565b9150610dae82610d6d565b602082019050919050565b60006020820190508181036000830152610dd281610d96565b905091905056fea264697066735822122042ac622ea83961c316d077ee2232dd2ad760e3427df26bce6fe111d4109a0f0e64736f6c63430008120033";

type AccessControlConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: AccessControlConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class AccessControl__factory extends ContractFactory {
  constructor(...args: AccessControlConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<AccessControl> {
    return super.deploy(overrides || {}) as Promise<AccessControl>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): AccessControl {
    return super.attach(address) as AccessControl;
  }
  override connect(signer: Signer): AccessControl__factory {
    return super.connect(signer) as AccessControl__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): AccessControlInterface {
    return new utils.Interface(_abi) as AccessControlInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): AccessControl {
    return new Contract(address, _abi, signerOrProvider) as AccessControl;
  }
}
