import hre, { ethers } from "hardhat";

async function main() {
  // ------------------- //
  // ----- EXAMPLE ----- //
  // ------------------- //

  try {
    await hre.run("verify:verify", {
      // https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html#using-programmatically
      address: "0xc0695B706629E4cC077f5d68497eeeC937Bf7e26", // contract specific address (not Diamond)
      constructorArguments: [], // empty for all facets except main Diamond contract deployed initially
      contract: "contracts/facets/core/Flow.sol:Flow", // contractPath:contractName
    });
  } catch (err) {
    console.log(err);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// npx hardhat run ./scripts/verify.ts --network mumbai
// NOTE: if have trouble verifying with some weird file not found error, delete `artifacts`/`cache` and try again
