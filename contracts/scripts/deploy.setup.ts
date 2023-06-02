import { Contract } from "ethers";
import hre, { ethers } from "hardhat";
import path from "path";
import fs from "fs/promises";
// @ts-ignore
import { FacetCutAction, getSelectors } from "../utils/diamond";
import { ZERO_BYTES, networkConfig } from "../utils/common";
import {
  ADDRESS_GELATO_AUTOBOT,
  MIN_APP_GELATO_BALANCE,
  MINIMUM_END_DURATION,
  MINIMUM_LIFESPAN,
  ST_BUFFER_DURATION_IN_SECONDS,
  ST_ADDRESSES,
} from "../test/common.test";

async function isExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function writeFile(filePath: string, data: any) {
  try {
    const dirname = path.dirname(filePath);
    const exist = await isExists(dirname);
    if (!exist) {
      await fs.mkdir(dirname, { recursive: true });
    }

    await fs.appendFile(filePath, data, "utf8");
  } catch (err: any) {
    throw new Error(err);
  }
} // ref: https://stackoverflow.com/a/65615651

const simpleDeploy = async (
  contractName: string,
  args: any[],
  chainId: number,
  timestamp: number,
  isLinkLib: boolean = false,
  isTest: boolean = false
) => {
  const [deployer] = await ethers.getSigners();

  //   let fContract
  //   if (isLinkLib) {
  //     fContract = await ethers.getContractFactory(contractName, deployer, {
  //         libraries: {
  //           ExampleLib: "0x...",
  //         });
  //   } else {
  //     fContract = await ethers.getContractFactory(contractName, deployer);
  //   }
  const fContract = await ethers.getContractFactory(contractName, deployer);
  const ctContract = await fContract.deploy(...args);
  await ctContract.deployed(); // vs await ctLoupe.deployTransaction.wait(1); | ref: https://github.com/ethers-io/ethers.js/discussions/1577#discussioncomment-764711

  const dir = "./addresses";
  const file = `${dir}/${networkConfig[chainId]["name"]}_${timestamp}.txt`;
  try {
    if (!isTest)
      await writeFile(file, `${ctContract.address} - ${contractName}\n`);
  } catch (error: any) {
    console.error(error);
  }

  return ctContract;
};

const addFacetCutProcedure = (contractFacets: Contract[]) => {
  const facetCutProcedures = [];

  for (let i = 0; i < contractFacets.length; i++) {
    const contractFacet = contractFacets[i];
    facetCutProcedures.push({
      facetAddress: contractFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(contractFacet),
    });
  }

  return facetCutProcedures;
};

export async function main(isTest: boolean = false) {
  const now = Date.now();

  const [deployer] = await ethers.getSigners();

  const chainId = hre.network.config.chainId;
  console.log("On Chain:", chainId);

  if (!chainId) return;

  // ------------------------- //
  // ----- deploy facets ----- //
  // ------------------------- //

  const ctLoupe = await simpleDeploy("Loupe", [], chainId, now, isTest);
  const ctCut = await simpleDeploy("Cut", [], chainId, now, isTest);
  const ctAccessControl = await simpleDeploy(
    "AccessControl",
    [],
    chainId,
    now,
    isTest
  );
  const ctUtility = await simpleDeploy("Utility", [], chainId, now, isTest);
  const ctAutomate = await simpleDeploy("Automate", [], chainId, now, isTest);
  const ctControl = await simpleDeploy("Control", [], chainId, now, isTest);
  const ctSession = await simpleDeploy("Session", [], chainId, now, isTest);
  const ctFlow = await simpleDeploy("Flow", [], chainId, now, isTest);
  const ctDiamond = await simpleDeploy(
    "Diamond",
    [deployer.address, ctCut.address],
    chainId,
    now,
    isTest
  );

  // Note: the contracts deployed above may be optionally verified

  // ---------------------------------------- //
  // ----- prepare facet cut procedures ----- //
  // ---------------------------------------- //

  const facetCutProcedures = addFacetCutProcedure([
    ctLoupe,
    ctAccessControl,
    ctUtility,
    ctAutomate,
    ctControl,
    ctSession,
    ctFlow,
  ]);

  // ----------------------- //
  // ----- cut diamond ----- //
  // ----------------------- //

  const fDiamondInit = await ethers.getContractFactory("DiamondInit", deployer);
  const ctDiamondInit = await fDiamondInit.deploy();
  await ctDiamondInit.deployed();

  const addressesSuperTokens = [networkConfig[chainId]["addrUSDCx"]];
  let initParams = [
    networkConfig[chainId]["addrGelAutobot"], // address _autobot,
    ethers.utils.parseEther("1"), // uint256 _minimumAppGelatoBalance,
    60, // uint256 _minimumEndDuration
    1, // uint256 _minimumLifespan (seconds)
    60, // uint256 _stBufferDurationInSecond, (in case of emergency where contract lack of supertoken funds, this is the duration at which it will last before contract loses it deposit -- DANGER)
    addressesSuperTokens, // ISuperToken[] memory _superTokens
  ] as any;

  if (isTest) {
    initParams = [
      ADDRESS_GELATO_AUTOBOT,
      MIN_APP_GELATO_BALANCE,
      MINIMUM_END_DURATION,
      MINIMUM_LIFESPAN,
      ST_BUFFER_DURATION_IN_SECONDS,
      ST_ADDRESSES,
    ] as any;
    console.log(
      "|| THIS DEPLOYMENT IS USING TEST PARAMETERS TO INITIALIZE DIAMOND CONTRACT ||"
    );
  }

  const encodedFunctionData = ctDiamondInit.interface.encodeFunctionData(
    "init",
    initParams
  );

  const ctDiamondCut = await ethers.getContractAt(`ICut`, ctDiamond.address); // call cut functionalities using main diamond address

  console.log("--- 💎 Diamond Cutting ");
  const tx = await ctDiamondCut.diamondCut(
    facetCutProcedures,
    ctDiamondInit.address, // ethers.constants.AddressZero,
    encodedFunctionData // ZERO_BYTES
  );
  const rcpt = await tx.wait();
  if (!rcpt.status) {
    throw Error(`!!! Diamond Cut Failed: ${tx.hash}`);
  }
  console.log("--- ✅ Cut Completed:", ctDiamond.address);

  // -------------------------- //
  // ----- verify example ----- //
  // -------------------------- //

  //   try {
  //     await hre.run("verify:verify", {
  //       // https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html#using-programmatically
  //       address: contractAddress,
  //       constructorArguments: [], // empty for all facets except main Diamond contract deployed initially
  //       contract: contractPathVerify, // contractPath:contractName
  //     });
  //   } catch (err) {
  //     console.log(err);
  //   }
  //
  // contractPath = "parent_folder/contracts/.../ContractName.sol"
  // contractPath = "contracts/facets/core/Automate.sol" <-- example

  // ---------------------------- //
  // ------ post deployment ----- //
  // ---------------------------- //

  const ctControlDeployer = await ethers.getContractAt(
    "Control",
    ctDiamond.address,
    deployer
  );

  const SOME_SUPER_BIG_FLOW_RATE = "99999000000000000000000";
  const PTR_720 = {
    "40": { gte: "225000000000000", lt: "300000000000000", bps: 4000 },
    "30": { gte: "300000000000000", lt: "450000000000000", bps: 3000 },
    "20": { gte: "450000000000000", lt: "600000000000000", bps: 2000 },
    "15": { gte: "600000000000000", lt: "900000000000000", bps: 1500 },
    "10": { gte: "900000000000000", lt: "1800000000000000", bps: 1000 },
    "5": { gte: "1800000000000000", lt: SOME_SUPER_BIG_FLOW_RATE, bps: 500 },
  }; // ref: https://docs.google.com/spreadsheets/d/1mx5hVm7k5jS4_htJNEfYTasWxx2Pcni0C1gqdQdWdaA/edit#gid=912411221

  const PTR_1080 = {
    "40": { gte: "300000000000000", lt: "400000000000000", bps: 4000 },
    "30": { gte: "400000000000000", lt: "600000000000000", bps: 3000 },
    "20": { gte: "600000000000000", lt: "800000000000000", bps: 2000 },
    "15": { gte: "800000000000000", lt: "1200000000000000", bps: 1500 },
    "10": { gte: "1200000000000000", lt: "2400000000000000", bps: 1000 },
    "5": { gte: "2400000000000000", lt: SOME_SUPER_BIG_FLOW_RATE, bps: 500 },
  }; // ref: https://docs.google.com/spreadsheets/d/1mx5hVm7k5jS4_htJNEfYTasWxx2Pcni0C1gqdQdWdaA/edit#gid=912411221

  const bpss720 = [
    PTR_720["40"].bps,
    PTR_720["30"].bps,
    PTR_720["20"].bps,
    PTR_720["15"].bps,
    PTR_720["10"].bps,
    PTR_720["5"].bps,
  ];
  const flowRateLowerBounds720 = [
    PTR_720["40"].gte,
    PTR_720["30"].gte,
    PTR_720["20"].gte,
    PTR_720["15"].gte,
    PTR_720["10"].gte,
    PTR_720["5"].gte,
  ];
  const flowRateUpperBounds720 = [
    PTR_720["40"].lt,
    PTR_720["30"].lt,
    PTR_720["20"].lt,
    PTR_720["15"].lt,
    PTR_720["10"].lt,
    PTR_720["5"].lt,
  ];
  const tags720 = [0, 1, 2, 3, 4, 5];

  /////

  const bpss1080 = [
    PTR_1080["40"].bps,
    PTR_1080["30"].bps,
    PTR_1080["20"].bps,
    PTR_1080["15"].bps,
    PTR_1080["10"].bps,
    PTR_1080["5"].bps,
  ];
  const flowRateLowerBounds1080 = [
    PTR_1080["40"].gte,
    PTR_1080["30"].gte,
    PTR_1080["20"].gte,
    PTR_1080["15"].gte,
    PTR_1080["10"].gte,
    PTR_1080["5"].gte,
  ];
  const flowRateUpperBounds1080 = [
    PTR_1080["40"].lt,
    PTR_1080["30"].lt,
    PTR_1080["20"].lt,
    PTR_1080["15"].lt,
    PTR_1080["10"].lt,
    PTR_1080["5"].lt,
  ];
  const tags1080 = [6, 7, 8, 9, 10, 11];

  //////

  if (!isTest) {
    const tx720 = await ctControlDeployer.setBPS(
      bpss720,
      flowRateLowerBounds720,
      flowRateUpperBounds720,
      tags720
    );
    const rcpt720 = await tx720.wait();

    const tx1080 = await ctControlDeployer.setBPS(
      bpss1080,
      flowRateLowerBounds1080,
      flowRateUpperBounds1080,
      tags1080
    );
    const rcpt1080 = await tx1080.wait();

    console.log("--- 🪧  Post Done");
  }

  //   const tx1 = await ctControlDeployer.toggleBPS();
  //   const rcpt1 = await tx1.wait();

  return ctDiamond;
}
