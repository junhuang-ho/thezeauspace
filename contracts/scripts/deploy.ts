import { main } from "./deploy.setup";

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// npx hardhat run ./scripts/deploy.ts --network mumbai
