import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { type SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, type BigNumber, type ContractTransaction } from "ethers";
import hre, { ethers } from "hardhat";
import { main as deployMain } from "../scripts/deploy.setup";
import { ZERO_BYTES, networkConfig } from "../utils/common";

import ISuperfluid from "@superfluid-finance/ethereum-contracts/build/contracts/ISuperfluid.json";
import ISuperToken from "@superfluid-finance/ethereum-contracts/build/contracts/ISuperToken.json";
import IConstantFlowAgreementV1 from "@superfluid-finance/ethereum-contracts/build/contracts/IConstantFlowAgreementV1.json";

const ABI_SF_HOST = ISuperfluid.abi;
const ABI_SUPERTOKEN = ISuperToken.abi;
const ABI_CFAV1 = IConstantFlowAgreementV1.abi;
import TaskTreasuryUpgradableABI from "../contracts/services/gelato/TaskTreasuryUpgradableABI.json";
import OpsImplementationABI from "../contracts/services/gelato/OpsImplementationABI.json";
import ABI_ERC20 from "../contracts/services/superfluid/ERC20_ABI.json";

const amGelatoFee = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const amAutobotFactory = "0xC815dB16D4be6ddf2685C201937905aBf338F5D7";
const GELATO_FEE = ethers.utils.parseEther("0.1");

// const chainId = hre.network.config.chainId;
// const CHAIN_ID_MUMBAI = 80001;
// export const ADDRESS_GELATO_AUTOBOT =
//   networkConfig[chainId ?? CHAIN_ID_MUMBAI]["addrGelAutobot"];
// // export const MINIMUM_DEPOSIT_AMOUNT = ethers.utils.parseEther("3"); // 1
// export const MINIMUM_FLOW_AMOUNT = ethers.utils.parseEther("2"); // 2
// export const MINIMUM_DEPOSIT_AMOUNT = MINIMUM_FLOW_AMOUNT.sub(
//   ethers.utils.parseEther("1")
// );
// export const MAX_FLOW_DURATION_PER_UNIT_FLOW_AMOUNT = 4092000; // 2592000 = 1 month in seconds
// export const MIN_CONTRACT_GELATO_BALANCE = ethers.utils.parseEther("0.5");
// export const ST_BUFFER_DURATION_IN_SECONDS = 3600;
// export const ST_ADDRESSES = [
//   networkConfig[chainId ?? CHAIN_ID_MUMBAI]["addrUSDCx"],
// ];

import {
  ADDRESS_GELATO_AUTOBOT,
  MIN_APP_GELATO_BALANCE,
  MINIMUM_END_DURATION,
  MINIMUM_LIFESPAN,
  ST_BUFFER_DURATION_IN_SECONDS,
  ST_ADDRESSES,
  BPS720,
  FRLB720,
  FRUB720,
  TAG720,
  BPS1080,
  FRLB1080,
  FRUB1080,
  TAG1080,
} from "./common.test";

describe("Main", () => {
  const encodeTimeArgs = (startTime: number, interval: number) => {
    const encoded = ethers.utils.defaultAbiCoder.encode(
      ["uint128", "uint128"],
      [startTime, interval]
    );

    return encoded;
  };

  const makeRich = async (signers: SignerWithAddress[], chainId: number) => {
    const amount = ethers.utils.parseEther("1000");

    for (let i = 0; i < signers.length; i++) {
      const ctUSDC = await ethers.getContractAt(
        ABI_ERC20,
        networkConfig[chainId]["addrUSDC"],
        signers[i]
      );

      const ctUSDCx = await ethers.getContractAt(
        ABI_SUPERTOKEN,
        networkConfig[chainId]["addrUSDCx"],
        signers[i]
      );

      var tx = await ctUSDC.mint(signers[i].address, amount);
      var rcpt = await tx.wait();

      var tx = await ctUSDC.approve(ctUSDCx.address, amount);
      var rcpt = await tx.wait();

      var tx = await ctUSDCx.upgrade(amount);
      var rcpt = await tx.wait();

      const ctDAI = await ethers.getContractAt(
        ABI_ERC20,
        networkConfig[chainId]["addrDAI"],
        signers[i]
      );

      const ctDAIx = await ethers.getContractAt(
        ABI_SUPERTOKEN,
        networkConfig[chainId]["addrDAIx"],
        signers[i]
      );

      var tx = await ctDAI.mint(signers[i].address, amount);
      var rcpt = await tx.wait();

      var tx = await ctDAI.approve(ctDAIx.address, amount);
      var rcpt = await tx.wait();

      var tx = await ctDAIx.upgrade(amount);
      var rcpt = await tx.wait();
    }
  };

  const fundContractWithNativeGas = async (
    contractAddress: string,
    amount: BigNumber
  ) => {
    const [deployer] = await ethers.getSigners();

    await deployer.sendTransaction({ value: amount, to: contractAddress });
  };

  const fundAppGelatoTresury = async (
    chainId: number,
    amMain: string,
    amount: BigNumber
  ) => {
    const [deployer, client1] = await ethers.getSigners();

    const ctAutomateClient1 = await ethers.getContractAt(
      "Automate",
      amMain,
      client1
    );

    var tx = await ctAutomateClient1.depositGelatoFunds({ value: amount });
    var rcpt = await tx.wait();
  };

  const investToApp = async (
    chainId: number,
    amMain: string,
    client: SignerWithAddress,
    amount: BigNumber
  ) => {
    const ctUSDCxClient = await ethers.getContractAt(
      ABI_SUPERTOKEN,
      networkConfig[chainId]["addrUSDCx"],
      client
    );
    const ctControlClient1 = await ethers.getContractAt(
      "Control",
      amMain,
      client
    );

    const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];

    var tx = await ctUSDCxClient.approve(amMain, amount);
    var rcpt = await tx.wait();

    var tx = (await ctControlClient1.depositAsset(
      supertokenUSDCx,
      amount
    )) as any;
    var rcpt = await tx.wait();
  };

  //   const approveDepositClientSTFundsToContract = async (
  //     client: SignerWithAddress,
  //     contractAddress: string,
  //     amountBounty: BigNumber,
  //     chainId: number
  //   ) => {
  //     const ctUSDCxClient = await ethers.getContractAt(
  //       ABI_SUPERTOKEN,
  //       networkConfig[chainId]["addrUSDCx"],
  //       client
  //     );

  //     var tx = await ctUSDCxClient.approve(contractAddress, amountBounty);
  //     var rcpt = await tx.wait();
  //   };

  //   const prefundSTToBountyContract = async (
  //     contractAddress: string,
  //     amount: BigNumber,
  //     chainId: number
  //   ) => {
  //     const [deployer] = await ethers.getSigners();

  //     const ctUSDCx = await ethers.getContractAt(
  //       ABI_SUPERTOKEN,
  //       networkConfig[chainId]["addrUSDCx"],
  //       deployer
  //     );

  //     var tx = await ctUSDCx.transfer(contractAddress, amount);
  //     var rcpt = await tx.wait();
  //   };

  //   const withdrawSTFromBountyContract = async (
  //     contractAddress: string,
  //     amount: BigNumber,
  //     chainId: number
  //   ) => {
  //     const [deployer] = await ethers.getSigners();

  //     const ctFlowSetup = await ethers.getContractAt(
  //       "FlowSetup",
  //       contractAddress,
  //       deployer
  //     );

  //     var tx = await ctFlowSetup.withdrawSuperToken(
  //       networkConfig[chainId]["addrUSDCx"],
  //       amount
  //     );
  //     var rcpt = await tx.wait();
  //   };

  const checkRoleValidity = async (
    amMain: string,
    signer: SignerWithAddress,
    role: string,
    shouldBe: boolean,
    isAdmin: boolean = false
  ) => {
    const ctAccessControl = await ethers.getContractAt(
      "AccessControl",
      amMain,
      signer
    );
    let roleHex;
    if (isAdmin) {
      roleHex = ctAccessControl.getDefaultAdminRole();
    } else {
      roleHex = await ctAccessControl.getRole(role);
    }
    const isRole = await ctAccessControl.hasRole(roleHex, signer.address);
    expect(isRole).to.be.equal(shouldBe);
  };

  const init = async () => {
    const [deployer, client1, client2, worker1, worker2] =
      await ethers.getSigners();

    const chainId = hre.network.config.chainId;
    console.log("On Chain:", chainId);

    if (!chainId) return;
    await makeRich([deployer, client1, client2, worker1, worker2], chainId);

    const ctBounty = await deployMain(true);
    if (!ctBounty) return;
    const amMain = ctBounty.address;

    const ctUtilityDeployer = await ethers.getContractAt(
      "Utility",
      amMain,
      deployer
    );
    const ctUtilityClient1 = await ethers.getContractAt(
      "Utility",
      amMain,
      client1
    );
    const ctAccessControlDeployer = await ethers.getContractAt(
      "AccessControl",
      amMain,
      deployer
    );
    const ctAccessControlClient1 = await ethers.getContractAt(
      "AccessControl",
      amMain,
      client1
    );
    const ctAutomateDeployer = await ethers.getContractAt(
      "Automate",
      amMain,
      deployer
    );
    const ctAutomateClient1 = await ethers.getContractAt(
      "Automate",
      amMain,
      client1
    );
    const ctControlDeployer = await ethers.getContractAt(
      "Control",
      amMain,
      deployer
    );
    const ctControlClient1 = await ethers.getContractAt(
      "Control",
      amMain,
      client1
    );
    const ctSessionClient1 = await ethers.getContractAt(
      "Session",
      amMain,
      client1
    );
    const ctFlowClient1 = await ethers.getContractAt("Flow", amMain, client1);

    const ctCFAV1 = await ethers.getContractAt(
      ABI_CFAV1,
      networkConfig[chainId]["addrCFAV1"],
      deployer
    );

    const ctUSDCx = await ethers.getContractAt(
      ABI_SUPERTOKEN,
      networkConfig[chainId]["addrUSDCx"],
      deployer
    );
    const ctUSDCxClient1 = await ethers.getContractAt(
      ABI_SUPERTOKEN,
      networkConfig[chainId]["addrUSDCx"],
      client1
    );
    const ctGelatoTreasury = new ethers.Contract(
      networkConfig[chainId]["addrGelTreasury"],
      TaskTreasuryUpgradableABI,
      deployer
    );

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [networkConfig[chainId]["addrGelNet"]],
    });
    const gelatoExecutor = ethers.provider.getSigner(
      networkConfig[chainId]["addrGelNet"]
    );

    const ctGelatoAutoBot = new ethers.Contract(
      networkConfig[chainId]["addrGelAutobot"],
      OpsImplementationABI,
      gelatoExecutor
    );

    const ctFlowGelatoExecutor = await ethers.getContractAt(
      "Flow",
      amMain,
      gelatoExecutor
    );

    return {
      chainId,
      ctUtilityDeployer,
      ctUtilityClient1,
      ctAccessControlDeployer,
      ctAccessControlClient1,
      ctAutomateDeployer,
      ctAutomateClient1,
      ctSessionClient1,
      ctControlDeployer,
      ctControlClient1,
      ctFlowClient1,
      ctFlowGelatoExecutor,
      ctCFAV1,
      ctUSDCx,
      ctUSDCxClient1,
      ctGelatoTreasury,
      ctGelatoAutoBot,
      gelatoExecutor,
      amMain,
      deployer,
      client1,
      client2,
      worker1,
      worker2,
    };
  };

  describe("deployment", async () => {
    it("Should deploy and set initial values correctly", async () => {
      const result = await loadFixture(init);
      if (!result) {
        expect(true).to.be.equal(false);
        return;
      }
      const {
        chainId,
        ctAutomateClient1,
        ctControlClient1,
        amMain,
        deployer,
        client1,
      } = result;

      // TODO: diamond / cut / loupe test separately (diamondTest.js)

      await checkRoleValidity(amMain, deployer, "", true, true);
      await checkRoleValidity(amMain, deployer, "MAINTAINER_ROLE", true);
      await checkRoleValidity(amMain, deployer, "TREASURER_ROLE", true);
      await checkRoleValidity(amMain, deployer, "STRATEGIST_ROLE", true);
      await checkRoleValidity(amMain, deployer, "DEVELOPER_ROLE", false);

      await checkRoleValidity(amMain, client1, "", false, true);
      await checkRoleValidity(amMain, client1, "MAINTAINER_ROLE", false);
      await checkRoleValidity(amMain, client1, "TREASURER_ROLE", false);
      await checkRoleValidity(amMain, client1, "STRATEGIST_ROLE", false);
      await checkRoleValidity(amMain, client1, "DEVELOPER_ROLE", false);

      const gelatoAddresses = await ctAutomateClient1.getGelatoAddresses();
      expect(gelatoAddresses[0]).to.be.equal(ADDRESS_GELATO_AUTOBOT);
      expect(gelatoAddresses[1]).to.be.equal(
        networkConfig[chainId]["addrGelTreasury"]
      );
      expect(gelatoAddresses[2]).to.be.equal(
        networkConfig[chainId]["addrGelNet"]
      );
      expect(gelatoAddresses[3]).to.be.equal(amAutobotFactory);
      expect(gelatoAddresses[4]).to.be.equal(amGelatoFee);

      expect(await ctAutomateClient1.getMinimumAppGelatoBalance()).to.be.equal(
        MIN_APP_GELATO_BALANCE
      );

      expect(
        await ctControlClient1.isSuperTokensSupported(ST_ADDRESSES[0])
      ).to.be.equal(true);
      expect(
        await ctControlClient1.isSuperTokensSupported(
          networkConfig[chainId]["addrDAIx"]
        )
      ).to.be.equal(false);

      expect(await ctControlClient1.getMinimumEndDuration()).to.be.equal(
        MINIMUM_END_DURATION
      );
      expect(await ctControlClient1.getMinimumLifespan()).to.be.equal(
        MINIMUM_LIFESPAN
      );
      expect(await ctControlClient1.getSTBufferDurationInSecond()).to.be.equal(
        ST_BUFFER_DURATION_IN_SECONDS
      );
    });
  });

  describe("Utility", async () => {
    describe("getNativeBalance", async () => {
      it("Should get contract native balance", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctUtilityClient1, amMain } = result;

        const amount = ethers.utils.parseEther("2");
        expect(await ctUtilityClient1.getNativeBalance()).to.be.equal(0);
        await fundContractWithNativeGas(amMain, amount);
        expect(await ctUtilityClient1.getNativeBalance()).to.be.equal(amount);
      });
    });
    describe("withdrawNativeBalance", async () => {
      it("Should revert if caller not have role", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUtilityDeployer,
          ctUtilityClient1,
          ctAccessControlClient1,
          amMain,
          client1,
        } = result;

        const roleHex = await ctAccessControlClient1.getRole("TREASURER_ROLE");
        const amount = ethers.utils.parseEther("2");
        const amount_ = ethers.utils.parseEther("1");
        await fundContractWithNativeGas(amMain, amount);

        // await expect(
        //   ctUtilityClient1.withdrawNativeBalance(amount)
        // ).to.be.revertedWith(
        //   `AccessControl: account ${client1.address} is missing role ${roleHex}`
        // ); // note: for some reason this revert string does not match eventhough text is exact same

        await expect(
          ctUtilityClient1.withdrawNativeBalance(amount.sub(amount_))
        ).to.be.reverted;
      });
      it("Should revert if insufficient funds", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUtilityDeployer,
          ctUtilityClient1,
          ctAccessControlClient1,
          amMain,
          client1,
        } = result;

        const amount = ethers.utils.parseEther("2");
        const amount_ = ethers.utils.parseEther("1");
        await fundContractWithNativeGas(amMain, amount);

        await expect(
          ctUtilityDeployer.withdrawNativeBalance(amount.add(amount_))
        ).to.be.revertedWithCustomError(
          ctUtilityDeployer,
          "FailedWithdrawNativeToken"
        );
      });
      it("Should withdraw native gas", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUtilityDeployer,
          ctUtilityClient1,
          ctAccessControlClient1,
          amMain,
          client1,
        } = result;

        const amount = ethers.utils.parseEther("2");
        const amount_ = ethers.utils.parseEther("1");
        await fundContractWithNativeGas(amMain, amount);

        var tx = await ctUtilityDeployer.withdrawNativeBalance(
          amount.sub(amount_)
        );
        var rcpt = await tx.wait();

        expect(await ctUtilityDeployer.getNativeBalance()).to.be.equal(amount_);
      });
    });
  });

  describe("AccessControl", async () => {
    describe("getRoleAdmin", async () => {
      it("Should be admin role equal to default admin role", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctAccessControlClient1, amMain } = result;

        const roleHexAdmin = await ctAccessControlClient1.getDefaultAdminRole();
        const roleHexMaintainer = await ctAccessControlClient1.getRole(
          "MAINTAINER_ROLE"
        );
        const roleHexTreasurer = await ctAccessControlClient1.getRole(
          "TREASURER_ROLE"
        );
        const roleHexStrategist = await ctAccessControlClient1.getRole(
          "STRATEGIST_ROLE"
        );
        const roleHexDeveloper = await ctAccessControlClient1.getRole(
          "DEVELOPER_ROLE"
        );

        expect(
          await ctAccessControlClient1.getRoleAdmin(roleHexMaintainer)
        ).to.be.equal(roleHexAdmin);
        expect(
          await ctAccessControlClient1.getRoleAdmin(roleHexTreasurer)
        ).to.be.equal(roleHexAdmin);
        expect(
          await ctAccessControlClient1.getRoleAdmin(roleHexStrategist)
        ).to.be.equal(roleHexAdmin);
        expect(
          await ctAccessControlClient1.getRoleAdmin(roleHexDeveloper)
        ).to.be.equal(roleHexAdmin);
      });
    });
    describe("grantRole", async () => {
      it("Should revert if caller not admin of role being granted", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctAccessControlClient1, client1, worker1 } = result;

        const roleHexMaintainer = await ctAccessControlClient1.getRole(
          "MAINTAINER_ROLE"
        );
        await expect(
          ctAccessControlClient1.grantRole(roleHexMaintainer, client1.address)
        ).to.be.reverted;
        await expect(
          ctAccessControlClient1.grantRole(roleHexMaintainer, worker1.address)
        ).to.be.reverted;
      });
      it("Should grant user role", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctAccessControlDeployer, client1 } = result;

        const roleHexMaintainer = await ctAccessControlDeployer.getRole(
          "MAINTAINER_ROLE"
        );

        expect(
          await ctAccessControlDeployer.hasRole(
            roleHexMaintainer,
            client1.address
          )
        ).to.be.equal(false);

        var tx = await ctAccessControlDeployer.grantRole(
          roleHexMaintainer,
          client1.address
        );
        var rcpt = await tx.wait();

        expect(
          await ctAccessControlDeployer.hasRole(
            roleHexMaintainer,
            client1.address
          )
        ).to.be.equal(true);
      });
    });
    describe("revokeRole", async () => {
      it("Should revert if caller not admin of role being revoked", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctAccessControlDeployer,
          ctAccessControlClient1,
          worker1,
        } = result;

        const roleHexMaintainer = await ctAccessControlDeployer.getRole(
          "MAINTAINER_ROLE"
        );

        var tx = await ctAccessControlDeployer.grantRole(
          roleHexMaintainer,
          worker1.address
        );
        var rcpt = await tx.wait();

        await expect(
          ctAccessControlClient1.revokeRole(roleHexMaintainer, worker1.address)
        ).to.be.reverted;
      });
      it("Should revoke user role", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctAccessControlDeployer, client1 } = result;

        const roleHexMaintainer = await ctAccessControlDeployer.getRole(
          "MAINTAINER_ROLE"
        );

        var tx = await ctAccessControlDeployer.grantRole(
          roleHexMaintainer,
          client1.address
        );
        var rcpt = await tx.wait();

        expect(
          await ctAccessControlDeployer.hasRole(
            roleHexMaintainer,
            client1.address
          )
        ).to.be.equal(true);

        var tx = await ctAccessControlDeployer.revokeRole(
          roleHexMaintainer,
          client1.address
        );
        var rcpt = await tx.wait();

        expect(
          await ctAccessControlDeployer.hasRole(
            roleHexMaintainer,
            client1.address
          )
        ).to.be.equal(false);
      });
    });
    describe("renounceRole", async () => {
      it("Should renonce role of caller regardless of if caller have role or not", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctAccessControlDeployer,
          ctAccessControlClient1,
          client1,
        } = result;

        const roleHexMaintainer = await ctAccessControlDeployer.getRole(
          "MAINTAINER_ROLE"
        );

        expect(
          await ctAccessControlDeployer.hasRole(
            roleHexMaintainer,
            client1.address
          )
        ).to.be.equal(false);

        var tx = await ctAccessControlClient1.renounceRole(roleHexMaintainer);
        var rcpt = await tx.wait();

        expect(
          await ctAccessControlDeployer.hasRole(
            roleHexMaintainer,
            client1.address
          )
        ).to.be.equal(false);

        var tx = await ctAccessControlDeployer.grantRole(
          roleHexMaintainer,
          client1.address
        );
        var rcpt = await tx.wait();

        expect(
          await ctAccessControlDeployer.hasRole(
            roleHexMaintainer,
            client1.address
          )
        ).to.be.equal(true);

        var tx = await ctAccessControlClient1.renounceRole(roleHexMaintainer);
        var rcpt = await tx.wait();

        expect(
          await ctAccessControlDeployer.hasRole(
            roleHexMaintainer,
            client1.address
          )
        ).to.be.equal(false);
      });
    });
  });

  describe("Automate", async () => {
    describe("setGelatoContracts", async () => {
      it("Should revert if caller not role", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctAutomateClient1, client1 } = result;

        await expect(ctAutomateClient1.setGelatoContracts(amGelatoFee)).to.be
          .reverted;
      });
      it("Should set gelato contract"); // need proper autobot contract to test
    });
    describe("setMinContractGelatoBalance", async () => {
      it("Should revert if caller not role", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctAutomateClient1, client1 } = result;

        const amount = MIN_APP_GELATO_BALANCE.sub(
          ethers.utils.parseEther("0.0001")
        );
        await expect(ctAutomateClient1.setMinimumAppGelatoBalance(amount)).to.be
          .reverted;
      });
      it("Should set min contract gelato balance", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctAutomateDeployer, client1 } = result;

        expect(
          await ctAutomateDeployer.getMinimumAppGelatoBalance()
        ).to.be.equal(MIN_APP_GELATO_BALANCE);

        const amount = ethers.utils.parseEther("3");
        var tx = await ctAutomateDeployer.setMinimumAppGelatoBalance(amount);
        var rcpt = await tx.wait();
        expect(
          await ctAutomateDeployer.getMinimumAppGelatoBalance()
        ).to.be.equal(amount);
      });
    });
    describe("depositGelatoFunds", async () => {
      it("Should deposit contract gelato balance", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctGelatoTreasury, amMain, client1 } = result;

        expect(
          await ctGelatoTreasury.userTokenBalance(amMain, amGelatoFee)
        ).to.be.equal(0);

        const amount = ethers.utils.parseEther("2");
        await fundAppGelatoTresury(chainId, amMain, amount);

        expect(
          await ctGelatoTreasury.userTokenBalance(amMain, amGelatoFee)
        ).to.be.equal(amount);
      });
    });
    describe("withdrawGelatoFunds", async () => {
      it("Should revert if caller not role", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctAutomateClient1, amMain, client1 } = result;

        const amount = ethers.utils.parseEther("2");
        await fundAppGelatoTresury(chainId, amMain, amount);

        await expect(ctAutomateClient1.withdrawGelatoFunds(amount)).to.be
          .reverted;
      });
      it("Should withdraw gelato funds", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctGelatoTreasury,
          ctAutomateDeployer,
          amMain,
          client1,
        } = result;

        const amount = ethers.utils.parseEther("2");
        await fundAppGelatoTresury(chainId, amMain, amount);

        expect(
          await ctGelatoTreasury.userTokenBalance(amMain, amGelatoFee)
        ).to.be.equal(amount);

        const amount_ = ethers.utils.parseEther("1");

        var tx = await ctAutomateDeployer.withdrawGelatoFunds(amount_);
        var rcpt = await tx.wait();

        expect(
          await ctGelatoTreasury.userTokenBalance(amMain, amGelatoFee)
        ).to.be.equal(amount.sub(amount_));
      });
    });
  });

  describe("Control", async () => {
    describe("setMinimumBalance", async () => {
      it("Should revert if caller not role", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlClient1, amMain, client1 } = result;

        const amount = 5;
        await expect(ctControlClient1.setMinimumEndDuration(amount)).to.be
          .reverted;
      });
      it("Should set min balance amount", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlDeployer, amMain, client1 } = result;

        expect(await ctControlDeployer.getMinimumEndDuration()).to.be.equal(
          MINIMUM_END_DURATION
        );

        const dur = 30;
        var tx = await ctControlDeployer.setMinimumEndDuration(dur);
        var rcpt = await tx.wait();

        expect(await ctControlDeployer.getMinimumEndDuration()).to.be.equal(
          dur
        );
      });
    });
    describe("setMinimumLifespan", async () => {
      it("Should revert if caller not role", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlClient1, amMain, client1 } = result;

        const amount = 61;
        await expect(ctControlClient1.setMinimumLifespan(amount)).to.be
          .reverted;
      });
      it("Should set min flow amount", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlDeployer, amMain, client1 } = result;

        expect(await ctControlDeployer.getMinimumLifespan()).to.be.equal(
          MINIMUM_LIFESPAN
        );

        const amount = 61;
        var tx = await ctControlDeployer.setMinimumLifespan(amount);
        var rcpt = await tx.wait();

        expect(await ctControlDeployer.getMinimumLifespan()).to.be.equal(
          amount
        );
      });
    });
    describe("setSTBufferAmount", async () => {
      it("Should revert if caller not role", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlClient1, amMain, client1 } = result;

        const amount = 5555;
        await expect(ctControlClient1.setSTBufferAmount(amount)).to.be.reverted;
      });
      it("Should set supertoken buffer amount", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlDeployer, amMain, client1 } = result;

        expect(
          await ctControlDeployer.getSTBufferDurationInSecond()
        ).to.be.equal(ST_BUFFER_DURATION_IN_SECONDS);

        const amount = 5555;
        var tx = await ctControlDeployer.setSTBufferAmount(amount);
        var rcpt = await tx.wait();

        expect(
          await ctControlDeployer.getSTBufferDurationInSecond()
        ).to.be.equal(amount);
      });
    });
    describe("addSuperToken", async () => {
      it("Should revert if not role", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlClient1, amMain, client1 } = result;

        const supertoken = networkConfig[chainId]["addrDAIx"];
        await expect(ctControlClient1.addSuperToken(supertoken)).to.be.reverted;
      });
      it("Should add supertoken", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlDeployer, amMain, client1 } = result;

        const supertoken = networkConfig[chainId]["addrDAIx"];

        expect(
          await ctControlDeployer.isSuperTokensSupported(supertoken)
        ).to.be.equal(false);

        var tx = await ctControlDeployer.addSuperToken(supertoken);
        var rcpt = await tx.wait();

        expect(
          await ctControlDeployer.isSuperTokensSupported(supertoken)
        ).to.be.equal(true);
      });
    });
    describe("removeSuperToken", async () => {
      it("Should revert if not role", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlClient1, amMain, client1 } = result;

        const supertoken = networkConfig[chainId]["addrDAIx"];
        await expect(ctControlClient1.removeSuperToken(supertoken)).to.be
          .reverted;
      });
      it("Should remove supertoken", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlDeployer, amMain, client1 } = result;

        const supertoken = networkConfig[chainId]["addrDAIx"];

        var tx = await ctControlDeployer.addSuperToken(supertoken);
        var rcpt = await tx.wait();

        expect(
          await ctControlDeployer.isSuperTokensSupported(supertoken)
        ).to.be.equal(true);

        var tx = await ctControlDeployer.removeSuperToken(supertoken);
        var rcpt = await tx.wait();

        expect(
          await ctControlDeployer.isSuperTokensSupported(supertoken)
        ).to.be.equal(false);
      });
    });
    describe("toggleBPS", async () => {
      it("Should revert if caller not role", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlClient1, amMain, client1 } = result;

        await expect(ctControlClient1.toggleBPS()).to.be.reverted;
      });
      it("Should set BPS enabled true/false", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlDeployer, amMain, client1 } = result;

        expect(await ctControlDeployer.isBPSEnabled()).to.be.equal(false);

        var tx = await ctControlDeployer.toggleBPS();
        var rcpt = await tx.wait();
        expect(await ctControlDeployer.isBPSEnabled()).to.be.equal(true);

        var tx = await ctControlDeployer.toggleBPS();
        var rcpt = await tx.wait();
        expect(await ctControlDeployer.isBPSEnabled()).to.be.equal(false);

        var tx = await ctControlDeployer.toggleBPS();
        var rcpt = await tx.wait();
        expect(await ctControlDeployer.isBPSEnabled()).to.be.equal(true);
      });
    });
    describe("setBPS", async () => {
      //   BPS720,
      //   FRLB720,
      //   FRUB720,
      //   TAG720,
      //   BPS1080,
      //   FRLB1080,
      //   FRUB1080,
      //   TAG1080,
      it("Should revert if caller not role", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlClient1, amMain, client1 } = result;

        await expect(ctControlClient1.setBPS(BPS720, FRLB720, FRUB720, TAG720))
          .to.be.reverted;
      });
      it("Should set BPS", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlDeployer, amMain, client1 } = result;

        expect(await ctControlDeployer.getBPSSize()).to.be.equal(0);
        for (let i = 0; i < TAG720.length; i++) {
          const tag = TAG720[i];
          const [bps_, frlb_, frub_] = await ctControlDeployer.getBPSData(tag);
          expect(bps_).to.be.equal(0);
          expect(frlb_).to.be.equal(0);
          expect(frub_).to.be.equal(0);
        }

        var tx = await ctControlDeployer.setBPS(
          BPS720,
          FRLB720,
          FRUB720,
          TAG720
        );
        var rcpt = await tx.wait();

        expect(await ctControlDeployer.getBPSSize()).to.be.equal(TAG720.length);
        for (let i = 0; i < TAG720.length; i++) {
          const tag = TAG720[i];
          const bps = BPS720[i];
          const frlb = FRLB720[i];
          const frub = FRUB720[i];
          const [bps_, frlb_, frub_] = await ctControlDeployer.getBPSData(tag);
          expect(bps_).to.be.equal(bps);
          expect(frlb_).to.be.equal(frlb);
          expect(frub_).to.be.equal(frub);
        }

        var tx = await ctControlDeployer.setBPS(
          BPS1080,
          FRLB1080,
          FRUB1080,
          TAG1080
        );
        var rcpt = await tx.wait();

        expect(await ctControlDeployer.getBPSSize()).to.be.equal(
          TAG720.length + TAG1080.length
        );
        var start = TAG720.at(0);
        for (let i = start ?? 0; i < TAG720.length; i++) {
          const tag = TAG720[i];
          const bps = BPS720[i];
          const frlb = FRLB720[i];
          const frub = FRUB720[i];
          const [bps_, frlb_, frub_] = await ctControlDeployer.getBPSData(tag);
          expect(bps_).to.be.equal(bps);
          expect(frlb_).to.be.equal(frlb);
          expect(frub_).to.be.equal(frub);
        }
        var start = TAG1080.at(0);
        for (let i = start ?? 6; i < TAG1080.length; i++) {
          const tag = TAG1080[i];
          const bps = BPS1080[i];
          const frlb = FRLB1080[i];
          const frub = FRUB1080[i];
          const [bps_, frlb_, frub_] = await ctControlDeployer.getBPSData(tag);
          expect(bps_).to.be.equal(bps);
          expect(frlb_).to.be.equal(frlb);
          expect(frub_).to.be.equal(frub);
        }
      });
    });
    describe("clearBPS", async () => {
      it("Should revert if caller not role", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlClient1, amMain, client1 } = result;
        await expect(ctControlClient1.clearBPS()).to.be.reverted;
      });
      it("Should clear BPS", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlDeployer, amMain, client1 } = result;

        expect(await ctControlDeployer.getBPSSize()).to.be.equal(0);
        for (let i = 0; i < TAG720.length; i++) {
          const tag = TAG720[i];
          const [bps_, frlb_, frub_] = await ctControlDeployer.getBPSData(tag);
          expect(bps_).to.be.equal(0);
          expect(frlb_).to.be.equal(0);
          expect(frub_).to.be.equal(0);
        }

        var tx = await ctControlDeployer.setBPS(
          BPS720,
          FRLB720,
          FRUB720,
          TAG720
        );
        var rcpt = await tx.wait();

        expect(await ctControlDeployer.getBPSSize()).to.be.equal(TAG720.length);
        for (let i = 0; i < TAG720.length; i++) {
          const tag = TAG720[i];
          const bps = BPS720[i];
          const frlb = FRLB720[i];
          const frub = FRUB720[i];
          const [bps_, frlb_, frub_] = await ctControlDeployer.getBPSData(tag);
          expect(bps_).to.be.equal(bps);
          expect(frlb_).to.be.equal(frlb);
          expect(frub_).to.be.equal(frub);
        }

        var tx = await ctControlDeployer.clearBPS();
        var rcpt = await tx.wait();

        expect(await ctControlDeployer.getBPSSize()).to.be.equal(0);
        for (let i = 0; i < TAG720.length; i++) {
          const tag = TAG720[i];
          const [bps_, frlb_, frub_] = await ctControlDeployer.getBPSData(tag);
          expect(bps_).to.be.equal(0);
          expect(frlb_).to.be.equal(0);
          expect(frub_).to.be.equal(0);
        }

        var tx = await ctControlDeployer.setBPS(
          BPS1080,
          FRLB1080,
          FRUB1080,
          TAG1080
        );
        var rcpt = await tx.wait();
        var tx = await ctControlDeployer.setBPS(
          BPS720,
          FRLB720,
          FRUB720,
          TAG720
        );
        var rcpt = await tx.wait();

        expect(await ctControlDeployer.getBPSSize()).to.be.equal(
          TAG720.length + TAG1080.length
        );
        var start = TAG1080.at(0);
        for (let i = start ?? 0; i < TAG1080.length; i++) {
          const tag = TAG1080[i];
          const bps = BPS1080[i];
          const frlb = FRLB1080[i];
          const frub = FRUB1080[i];
          const [bps_, frlb_, frub_] = await ctControlDeployer.getBPSData(tag);
          expect(bps_).to.be.equal(bps);
          expect(frlb_).to.be.equal(frlb);
          expect(frub_).to.be.equal(frub);
        }
        var start = TAG720.at(0);
        for (let i = start ?? 6; i < TAG720.length; i++) {
          const tag = TAG720[i];
          const bps = BPS720[i];
          const frlb = FRLB720[i];
          const frub = FRUB720[i];
          const [bps_, frlb_, frub_] = await ctControlDeployer.getBPSData(tag);
          expect(bps_).to.be.equal(bps);
          expect(frlb_).to.be.equal(frlb);
          expect(frub_).to.be.equal(frub);
        }
      });
    });
    describe("setSBPS", async () => {
      it("Should revert if caller not role", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlClient1, amMain, client1 } = result;

        await expect(ctControlClient1.setSBPS(4000, client1.address)).to.be
          .reverted;
      });
      it("Should set user as sbps", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlDeployer, amMain, client1 } = result;

        expect(await ctControlDeployer.getSBPS(client1.address)).to.be.equal(0);

        const value = 4000;
        var tx = await ctControlDeployer.setSBPS(value, client1.address);
        var rcpt = await tx.wait();

        expect(await ctControlDeployer.getSBPS(client1.address)).to.be.equal(
          value
        );
      });
    });
    describe("depositAsset", async () => {
      it("Should revert if supertoken not supported", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlClient1, amMain, client1 } = result;

        const supertoken = networkConfig[chainId]["addrDAIx"];
        const amount = ethers.utils.parseEther("3");
        await expect(
          ctControlClient1.depositAsset(supertoken, amount)
        ).to.be.revertedWithCustomError(ctControlClient1, "InvalidSuperToken");
      });
      it("Should increase supertoken balance", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlClient1, ctUSDCxClient1, amMain, client1 } =
          result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const amount = ethers.utils.parseEther("3");

        expect(
          await ctControlClient1.getAssetUser(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        expect(
          await ctControlClient1.getAssetUser(client1.address, supertokenDAIx)
        ).to.be.equal(0);

        var tx = await ctUSDCxClient1.approve(amMain, amount);
        var rcpt = await tx.wait();

        var tx = (await ctControlClient1.depositAsset(
          supertokenUSDCx,
          amount
        )) as any;
        var rcpt = await tx.wait();

        expect(
          await ctControlClient1.getAssetUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctControlClient1.getAssetUser(client1.address, supertokenDAIx)
        ).to.be.equal(0);
      });
    });
    describe("withdrawAsset", async () => {
      it("Should revert if insufficient assets", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlClient1, ctUSDCxClient1, amMain, client1 } =
          result;
        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const amt2 = ethers.utils.parseEther("100");

        expect(
          await ctControlClient1.getAssetUser(client1.address, supertokenUSDCx)
        ).to.be.equal(0);

        await expect(
          ctControlClient1.withdrawAsset(supertokenUSDCx, amt2)
        ).to.be.revertedWithCustomError(ctControlClient1, "InsufficientAssets");

        expect(
          await ctControlClient1.getAssetUser(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
      });
      it("Should decrease app balance and withdraw to EOA", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctControlClient1, ctUSDCxClient1, amMain, client1 } =
          result;

        const bal1 = await ctUSDCxClient1.balanceOf(client1.address);

        const amount = ethers.utils.parseEther("1000");
        await investToApp(chainId, amMain, client1, amount);

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        expect(
          await ctControlClient1.getAssetUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);

        const bal2 = await ctUSDCxClient1.balanceOf(client1.address);
        expect(bal2).to.be.equal(bal1.sub(amount));

        const amt2 = ethers.utils.parseEther("100");
        var tx = await ctControlClient1.withdrawAsset(supertokenUSDCx, amt2);
        var rcpt = await tx.wait();

        expect(
          await ctControlClient1.getAssetUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount.sub(amt2));

        const bal3 = await ctUSDCxClient1.balanceOf(client1.address);
        expect(bal3).to.be.equal(bal2.add(amt2));
      });
    });
    describe("getAssetTotal", async () => {
      it("Should get total asset from all users", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctControlDeployer,
          ctControlClient1,
          ctUSDCxClient1,
          amMain,
          client1,
          client2,
        } = result;

        const ctControlClient2 = await ethers.getContractAt(
          "Control",
          amMain,
          client2
        );
        const ctUSDCxClient2 = await ethers.getContractAt(
          ABI_SUPERTOKEN,
          networkConfig[chainId]["addrUSDCx"],
          client2
        );

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];

        expect(
          await ctControlClient1.getAssetUser(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        expect(
          await ctControlClient2.getAssetUser(client2.address, supertokenUSDCx)
        ).to.be.equal(0);
        expect(
          await ctControlDeployer.getAssetTotal(supertokenUSDCx)
        ).to.be.equal(0);

        const amount = ethers.utils.parseEther("100");

        var tx = await ctUSDCxClient1.approve(amMain, amount);
        var rcpt = await tx.wait();

        var tx = (await ctControlClient1.depositAsset(
          supertokenUSDCx,
          amount
        )) as any;
        var rcpt = await tx.wait();

        var tx = await ctUSDCxClient2.approve(amMain, amount);
        var rcpt = await tx.wait();

        var tx = (await ctControlClient2.depositAsset(
          supertokenUSDCx,
          amount
        )) as any;
        var rcpt = await tx.wait();

        expect(
          await ctControlClient1.getAssetUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctControlClient2.getAssetUser(client2.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctControlDeployer.getAssetTotal(supertokenUSDCx)
        ).to.be.equal(amount.mul(2));
      });
    });
    describe("isNewFlowRateAllowed", async () => {
      it("Should be false if app insufficient supertoken funds", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctControlDeployer,
          ctControlClient1,
          ctUSDCxClient1,
          amMain,
          client1,
          client2,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];

        const flowRate = ethers.utils.parseEther("0.0001");
        expect(
          await ctControlDeployer.isNewFlowRateAllowed(
            supertokenUSDCx,
            flowRate
          )
        ).to.be.equal(false);
        expect(await ctUSDCxClient1.balanceOf(amMain)).to.be.equal(0);

        const amt = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amt);

        expect(
          await ctControlDeployer.isNewFlowRateAllowed(
            supertokenUSDCx,
            flowRate
          )
        ).to.be.equal(true);
        expect(await ctUSDCxClient1.balanceOf(amMain)).to.be.equal(amt);
      });
    });
    describe("app fee balance", async () => {
      it("Should update control record states when flow is open", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minEndDuration = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var [receiver, sesNonce, tsIncrease, tsDecrease] =
          await ctControlDeployer.getControlData(supertokenUSDCx, 0);
        expect(receiver).to.be.equal(ethers.constants.AddressZero);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(0);
        expect(tsDecrease).to.be.equal(0);
        expect(
          await ctControlDeployer.getNewControlNonce(supertokenUSDCx)
        ).to.be.equal(0);
        expect(
          await ctControlDeployer.getNewControlNonce(supertokenDAIx)
        ).to.be.equal(0);

        const lifespan = minEndDuration.add(minLifespan);
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var [receiver, sesNonce, tsIncrease, tsDecrease] =
          await ctControlDeployer.getControlData(supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(0);
        expect(
          await ctControlDeployer.getNewControlNonce(supertokenUSDCx)
        ).to.be.equal(1);
        expect(
          await ctControlDeployer.getNewControlNonce(supertokenDAIx)
        ).to.be.equal(0);
      });
      it("Should update control record states when flow is closed manually", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minEndDuration = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = minEndDuration.add(minLifespan);
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        await time.increase(minLifespan.toNumber());

        var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        var [receiver, sesNonce, tsIncrease, tsDecrease] =
          await ctControlDeployer.getControlData(supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(now2);
        expect(
          await ctControlDeployer.getNewControlNonce(supertokenUSDCx)
        ).to.be.equal(1);
      });
      it("Should update control record states when flow is closed automatically", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minEndDuration = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = minEndDuration.add(minLifespan).toNumber();
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();
        var rc = await ethers.provider.getTransactionReceipt(
          rcpt.transactionHash
        );
        var block = await ethers.provider.getBlock(rc.blockNumber);
        var startTime = block.timestamp;

        var execData = ctFlowClient1.interface.encodeFunctionData(
          "decreaseFlow",
          [supertokenUSDCx, client1.address, worker1.address, 0, flowRateUSDCx]
        );
        var timeArgs = encodeTimeArgs(startTime + lifespan, lifespan);
        var moduleData = {
          modules: [1, 3],
          args: [timeArgs],
        };

        await time.increase(lifespan);

        await ctGelatoAutoBot
          .connect(gelatoExecutor)
          .exec(
            amMain,
            amMain,
            execData,
            moduleData,
            GELATO_FEE,
            amGelatoFee,
            true,
            true
          );
        const tsDecreaseFlow = await time.latest();

        var [receiver, sesNonce, tsIncrease, tsDecrease] =
          await ctControlDeployer.getControlData(supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(tsDecreaseFlow);
        expect(
          await ctControlDeployer.getNewControlNonce(supertokenUSDCx)
        ).to.be.equal(1);
      });
      describe("realizeFeeBalance", async () => {
        it("Should do nothing if `count` param is 0", async () => {
          const result = await loadFixture(init);
          if (!result) {
            expect(true).to.be.equal(false);
            return;
          }
          const {
            chainId,
            ctUSDCxClient1,
            ctCFAV1,
            ctControlDeployer,
            ctSessionClient1,
            ctFlowClient1,
            ctGelatoAutoBot,
            amMain,
            client1,
            worker1,
          } = result;

          const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
          const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
          const flowRateUSDCx = ethers.utils.parseEther("0.01");
          const flowRateDAIx = ethers.utils.parseEther("0.02");

          await fundAppGelatoTresury(
            chainId,
            amMain,
            ethers.utils.parseEther("2")
          );

          const amountInvest = ethers.utils.parseEther("100");
          await investToApp(chainId, amMain, client1, amountInvest);

          const ctSessionWorker1 = await ethers.getContractAt(
            "Session",
            amMain,
            worker1
          );

          var tx = await ctSessionWorker1.startSessions(
            [supertokenUSDCx],
            [flowRateUSDCx],
            [0]
          );
          var rcpt = await tx.wait();

          const minEndDuration =
            await ctControlDeployer.getMinimumEndDuration();
          const minLifespan = await ctControlDeployer.getMinimumLifespan();
          const amount = ethers.utils.parseEther("600");
          var tx = (await ctUSDCxClient1.approve(
            amMain,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          var tx = (await ctFlowClient1.depositSuperToken(
            supertokenUSDCx,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          const lifespan = minEndDuration.add(minLifespan).toNumber();
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan
          );
          var rcpt = await tx.wait();
          const now1 = await time.latest();

          await time.increase(lifespan);

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
          var rcpt = await tx.wait();
          const now2 = await time.latest();

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(0);

          var tx = await ctControlDeployer.realizeFeeBalance(
            0,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(0);
        });
        it("Should do nothing if bps is not enabled or set or no sbps", async () => {
          const result = await loadFixture(init);
          if (!result) {
            expect(true).to.be.equal(false);
            return;
          }
          const {
            chainId,
            ctUSDCxClient1,
            ctCFAV1,
            ctControlDeployer,
            ctSessionClient1,
            ctFlowClient1,
            ctGelatoAutoBot,
            amMain,
            client1,
            worker1,
          } = result;

          const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
          const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
          const flowRateUSDCx = ethers.utils.parseEther("0.01");
          const flowRateDAIx = ethers.utils.parseEther("0.02");

          await fundAppGelatoTresury(
            chainId,
            amMain,
            ethers.utils.parseEther("2")
          );

          const amountInvest = ethers.utils.parseEther("100");
          await investToApp(chainId, amMain, client1, amountInvest);

          const ctSessionWorker1 = await ethers.getContractAt(
            "Session",
            amMain,
            worker1
          );

          var tx = await ctSessionWorker1.startSessions(
            [supertokenUSDCx],
            [flowRateUSDCx],
            [0]
          );
          var rcpt = await tx.wait();

          const minEndDuration =
            await ctControlDeployer.getMinimumEndDuration();
          const minLifespan = await ctControlDeployer.getMinimumLifespan();
          const amount = ethers.utils.parseEther("600");
          var tx = (await ctUSDCxClient1.approve(
            amMain,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          var tx = (await ctFlowClient1.depositSuperToken(
            supertokenUSDCx,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          const lifespan = minEndDuration.add(minLifespan).toNumber() + 5;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan
          );
          var rcpt = await tx.wait();
          const now1 = await time.latest();

          await time.increase(lifespan);

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
          var rcpt = await tx.wait();
          const now2 = await time.latest();

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(0);

          var tx = await ctControlDeployer.realizeFeeBalance(
            1,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(0);
        });
        it("Should realize the correct amount of fee balance", async () => {
          const result = await loadFixture(init);
          if (!result) {
            expect(true).to.be.equal(false);
            return;
          }
          const {
            chainId,
            ctUSDCxClient1,
            ctCFAV1,
            ctControlDeployer,
            ctSessionClient1,
            ctFlowClient1,
            ctGelatoAutoBot,
            amMain,
            gelatoExecutor,
            client1,
            worker1,
          } = result;

          const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
          const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
          const flowRateUSDCx = ethers.utils.parseEther("0.00023");
          const flowRateDAIx = ethers.utils.parseEther("0.02");

          const tx720 = await ctControlDeployer.setBPS(
            BPS720,
            FRLB720,
            FRUB720,
            TAG720
          );
          const rcpt720 = await tx720.wait();
          const tx1 = await ctControlDeployer.toggleBPS();
          const rcpt1 = await tx1.wait();

          await fundAppGelatoTresury(
            chainId,
            amMain,
            ethers.utils.parseEther("2")
          );

          const amountInvest = ethers.utils.parseEther("100");
          await investToApp(chainId, amMain, client1, amountInvest);

          const ctSessionWorker1 = await ethers.getContractAt(
            "Session",
            amMain,
            worker1
          );

          var tx = await ctSessionWorker1.startSessions(
            [supertokenUSDCx],
            [flowRateUSDCx],
            [0]
          );
          var rcpt = await tx.wait();

          const minEndDuration =
            await ctControlDeployer.getMinimumEndDuration();
          const minLifespan = await ctControlDeployer.getMinimumLifespan();
          const amount = ethers.utils.parseEther("600");
          var tx = (await ctUSDCxClient1.approve(
            amMain,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          var tx = (await ctFlowClient1.depositSuperToken(
            supertokenUSDCx,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          const lifespan = minEndDuration.add(minLifespan).toNumber() + 5;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan
          );
          var rcpt = await tx.wait();
          const now1 = await time.latest();

          await time.increase(lifespan);

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
          var rcpt = await tx.wait();
          const now2 = await time.latest();

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(0);

          var tx = await ctControlDeployer.realizeFeeBalance(
            1,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 0);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );
          var amountFee = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(amountFee);
        });
        it("Should realize the correct amount of fee balance - multi count", async () => {
          const result = await loadFixture(init);
          if (!result) {
            expect(true).to.be.equal(false);
            return;
          }
          const {
            chainId,
            ctUSDCxClient1,
            ctCFAV1,
            ctControlDeployer,
            ctSessionClient1,
            ctFlowClient1,
            ctGelatoAutoBot,
            amMain,
            gelatoExecutor,
            client1,
            worker1,
            worker2,
          } = result;

          const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
          const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
          const flowRateUSDCx = ethers.utils.parseEther("0.00023");
          const flowRateDAIx = ethers.utils.parseEther("0.02");

          const tx720 = await ctControlDeployer.setBPS(
            BPS720,
            FRLB720,
            FRUB720,
            TAG720
          );
          const rcpt720 = await tx720.wait();
          const tx1 = await ctControlDeployer.toggleBPS();
          const rcpt1 = await tx1.wait();

          await fundAppGelatoTresury(
            chainId,
            amMain,
            ethers.utils.parseEther("2")
          );

          const amountInvest = ethers.utils.parseEther("100");
          await investToApp(chainId, amMain, client1, amountInvest);

          const ctSessionWorker1 = await ethers.getContractAt(
            "Session",
            amMain,
            worker1
          );

          var tx = await ctSessionWorker1.startSessions(
            [supertokenUSDCx],
            [flowRateUSDCx],
            [0]
          );
          var rcpt = await tx.wait();

          const minEndDuration =
            await ctControlDeployer.getMinimumEndDuration();
          const minLifespan = await ctControlDeployer.getMinimumLifespan();
          const amount = ethers.utils.parseEther("600");
          var tx = (await ctUSDCxClient1.approve(
            amMain,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          var tx = (await ctFlowClient1.depositSuperToken(
            supertokenUSDCx,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          const lifespan1 = minEndDuration.add(minLifespan).toNumber() + 5;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan1
          );
          var rcpt = await tx.wait();
          const now1 = await time.latest();

          await time.increase(minLifespan.toNumber());

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
          var rcpt = await tx.wait();
          const now2 = await time.latest();

          const lifespan2 = minEndDuration.add(minLifespan).toNumber() + 100;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan2
          );
          var rcpt = await tx.wait();
          const now3 = await time.latest();
          var rc = await ethers.provider.getTransactionReceipt(
            rcpt.transactionHash
          );
          var block = await ethers.provider.getBlock(rc.blockNumber);
          var startTime = block.timestamp;

          var execData = ctFlowClient1.interface.encodeFunctionData(
            "decreaseFlow",
            [
              supertokenUSDCx,
              client1.address,
              worker1.address,
              1,
              flowRateUSDCx,
            ]
          );
          var timeArgs = encodeTimeArgs(startTime + lifespan2, lifespan2);
          var moduleData = {
            modules: [1, 3],
            args: [timeArgs],
          };

          await time.increase(
            minEndDuration.add(minLifespan).toNumber() + 100 - 1
          );

          await ctGelatoAutoBot
            .connect(gelatoExecutor)
            .exec(
              amMain,
              amMain,
              execData,
              moduleData,
              GELATO_FEE,
              amGelatoFee,
              true,
              true
            );
          const now4 = await time.latest();

          const lifespan3 = minEndDuration.add(minLifespan).toNumber() + 20;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan3
          );
          var rcpt = await tx.wait();
          const now5 = await time.latest();

          await time.increase(minLifespan.toNumber() - 1);

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 2);
          var rcpt = await tx.wait();
          const now6 = await time.latest();

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(0);

          var tx = await ctControlDeployer.realizeFeeBalance(
            3,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 0);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );
          const amountFee1 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 1);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );

          const amountFee2 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 2);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );

          const amountFee3 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(amountFee1.add(amountFee2).add(amountFee3));
        });
        it("Should realize the correct amount of fee balance - called twice", async () => {
          const result = await loadFixture(init);
          if (!result) {
            expect(true).to.be.equal(false);
            return;
          }
          const {
            chainId,
            ctUSDCxClient1,
            ctCFAV1,
            ctControlDeployer,
            ctSessionClient1,
            ctFlowClient1,
            ctGelatoAutoBot,
            amMain,
            gelatoExecutor,
            client1,
            worker1,
            worker2,
          } = result;

          const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
          const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
          const flowRateUSDCx = ethers.utils.parseEther("0.00023");
          const flowRateDAIx = ethers.utils.parseEther("0.02");

          const tx720 = await ctControlDeployer.setBPS(
            BPS720,
            FRLB720,
            FRUB720,
            TAG720
          );
          const rcpt720 = await tx720.wait();
          const tx1 = await ctControlDeployer.toggleBPS();
          const rcpt1 = await tx1.wait();

          await fundAppGelatoTresury(
            chainId,
            amMain,
            ethers.utils.parseEther("2")
          );

          const amountInvest = ethers.utils.parseEther("100");
          await investToApp(chainId, amMain, client1, amountInvest);

          const ctSessionWorker1 = await ethers.getContractAt(
            "Session",
            amMain,
            worker1
          );

          var tx = await ctSessionWorker1.startSessions(
            [supertokenUSDCx],
            [flowRateUSDCx],
            [0]
          );
          var rcpt = await tx.wait();

          const minEndDuration =
            await ctControlDeployer.getMinimumEndDuration();
          const minLifespan = await ctControlDeployer.getMinimumLifespan();
          const amount = ethers.utils.parseEther("600");
          var tx = (await ctUSDCxClient1.approve(
            amMain,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          var tx = (await ctFlowClient1.depositSuperToken(
            supertokenUSDCx,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          const lifespan1 = minEndDuration.add(minLifespan).toNumber() + 5;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan1
          );
          var rcpt = await tx.wait();
          const now1 = await time.latest();

          await time.increase(minLifespan.toNumber());

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
          var rcpt = await tx.wait();
          const now2 = await time.latest();

          const lifespan2 = minEndDuration.add(minLifespan).toNumber() + 100;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan2
          );
          var rcpt = await tx.wait();
          const now3 = await time.latest();
          var rc = await ethers.provider.getTransactionReceipt(
            rcpt.transactionHash
          );
          var block = await ethers.provider.getBlock(rc.blockNumber);
          var startTime = block.timestamp;

          var execData = ctFlowClient1.interface.encodeFunctionData(
            "decreaseFlow",
            [
              supertokenUSDCx,
              client1.address,
              worker1.address,
              1,
              flowRateUSDCx,
            ]
          );
          var timeArgs = encodeTimeArgs(startTime + lifespan2, lifespan2);
          var moduleData = {
            modules: [1, 3],
            args: [timeArgs],
          };

          await time.increase(
            minEndDuration.add(minLifespan).toNumber() + 100 - 1
          );

          await ctGelatoAutoBot
            .connect(gelatoExecutor)
            .exec(
              amMain,
              amMain,
              execData,
              moduleData,
              GELATO_FEE,
              amGelatoFee,
              true,
              true
            );
          const now4 = await time.latest();

          const lifespan3 = minEndDuration.add(minLifespan).toNumber() + 20;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan3
          );
          var rcpt = await tx.wait();
          const now5 = await time.latest();

          await time.increase(minLifespan.toNumber() - 1);

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 2);
          var rcpt = await tx.wait();
          const now6 = await time.latest();

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(0);

          var tx = await ctControlDeployer.realizeFeeBalance(
            1,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 0);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );
          const amountFee1 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(amountFee1);

          var tx = await ctControlDeployer.realizeFeeBalance(
            2,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 1);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );

          const amountFee2 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 2);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );

          const amountFee3 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(amountFee1.add(amountFee2).add(amountFee3));
        });
        it("Should realize the correct amount of fee balance even after revert in realization call before", async () => {
          const result = await loadFixture(init);
          if (!result) {
            expect(true).to.be.equal(false);
            return;
          }
          const {
            chainId,
            ctUSDCxClient1,
            ctCFAV1,
            ctControlDeployer,
            ctSessionClient1,
            ctFlowClient1,
            ctGelatoAutoBot,
            amMain,
            gelatoExecutor,
            client1,
            worker1,
            worker2,
          } = result;

          const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
          const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
          const flowRateUSDCx = ethers.utils.parseEther("0.00023");
          const flowRateDAIx = ethers.utils.parseEther("0.02");

          const tx720 = await ctControlDeployer.setBPS(
            BPS720,
            FRLB720,
            FRUB720,
            TAG720
          );
          const rcpt720 = await tx720.wait();
          const tx1 = await ctControlDeployer.toggleBPS();
          const rcpt1 = await tx1.wait();

          await fundAppGelatoTresury(
            chainId,
            amMain,
            ethers.utils.parseEther("2")
          );

          const amountInvest = ethers.utils.parseEther("100");
          await investToApp(chainId, amMain, client1, amountInvest);

          const ctSessionWorker1 = await ethers.getContractAt(
            "Session",
            amMain,
            worker1
          );

          var tx = await ctSessionWorker1.startSessions(
            [supertokenUSDCx],
            [flowRateUSDCx],
            [0]
          );
          var rcpt = await tx.wait();

          const minEndDuration =
            await ctControlDeployer.getMinimumEndDuration();
          const minLifespan = await ctControlDeployer.getMinimumLifespan();
          const amount = ethers.utils.parseEther("600");
          var tx = (await ctUSDCxClient1.approve(
            amMain,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          var tx = (await ctFlowClient1.depositSuperToken(
            supertokenUSDCx,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          const lifespan1 = minEndDuration.add(minLifespan).toNumber() + 5;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan1
          );
          var rcpt = await tx.wait();
          const now1 = await time.latest();

          await time.increase(minLifespan.toNumber());

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
          var rcpt = await tx.wait();
          const now2 = await time.latest();

          const lifespan2 = minEndDuration.add(minLifespan).toNumber() + 100;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan2
          );
          var rcpt = await tx.wait();
          const now3 = await time.latest();
          var rc = await ethers.provider.getTransactionReceipt(
            rcpt.transactionHash
          );
          var block = await ethers.provider.getBlock(rc.blockNumber);
          var startTime = block.timestamp;

          var execData = ctFlowClient1.interface.encodeFunctionData(
            "decreaseFlow",
            [
              supertokenUSDCx,
              client1.address,
              worker1.address,
              1,
              flowRateUSDCx,
            ]
          );
          var timeArgs = encodeTimeArgs(startTime + lifespan2, lifespan2);
          var moduleData = {
            modules: [1, 3],
            args: [timeArgs],
          };

          await time.increase(
            minEndDuration.add(minLifespan).toNumber() + 100 - 1
          );

          await ctGelatoAutoBot
            .connect(gelatoExecutor)
            .exec(
              amMain,
              amMain,
              execData,
              moduleData,
              GELATO_FEE,
              amGelatoFee,
              true,
              true
            );
          const now4 = await time.latest();

          const lifespan3 = minEndDuration.add(minLifespan).toNumber() + 20;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan3
          );
          var rcpt = await tx.wait();
          const now5 = await time.latest();

          await time.increase(minLifespan.toNumber() - 1);

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 2);
          var rcpt = await tx.wait();
          const now6 = await time.latest();

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(0);

          var tx = await ctControlDeployer.realizeFeeBalance(
            1,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 0);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );
          const amountFee1 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(amountFee1);

          var tx = await ctControlDeployer.realizeFeeBalance(
            2,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 1);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );

          const amountFee2 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 2);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );

          const amountFee3 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(amountFee1.add(amountFee2).add(amountFee3));

          await expect(
            ctControlDeployer.realizeFeeBalance(1, supertokenUSDCx)
          ).to.be.revertedWithCustomError(ctControlDeployer, "ContractError");

          const lifespan4 = minEndDuration.add(minLifespan).toNumber() + 7;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan4
          );
          var rcpt = await tx.wait();
          const now7 = await time.latest();

          await time.increase(minLifespan.toNumber());

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 3);
          var rcpt = await tx.wait();
          const now8 = await time.latest();

          var tx = await ctControlDeployer.realizeFeeBalance(
            1,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 3);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );

          const amountFee4 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(
            amountFee1.add(amountFee2).add(amountFee3).add(amountFee4)
          );
        });
        it("Should revert if realize count has active flow", async () => {
          const result = await loadFixture(init);
          if (!result) {
            expect(true).to.be.equal(false);
            return;
          }
          const {
            chainId,
            ctUSDCxClient1,
            ctCFAV1,
            ctControlDeployer,
            ctSessionClient1,
            ctFlowClient1,
            ctGelatoAutoBot,
            amMain,
            gelatoExecutor,
            client1,
            worker1,
            worker2,
          } = result;

          const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
          const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
          const flowRateUSDCx = ethers.utils.parseEther("0.00023");
          const flowRateDAIx = ethers.utils.parseEther("0.02");

          const tx720 = await ctControlDeployer.setBPS(
            BPS720,
            FRLB720,
            FRUB720,
            TAG720
          );
          const rcpt720 = await tx720.wait();
          const tx1 = await ctControlDeployer.toggleBPS();
          const rcpt1 = await tx1.wait();

          await fundAppGelatoTresury(
            chainId,
            amMain,
            ethers.utils.parseEther("2")
          );

          const amountInvest = ethers.utils.parseEther("100");
          await investToApp(chainId, amMain, client1, amountInvest);

          const ctSessionWorker1 = await ethers.getContractAt(
            "Session",
            amMain,
            worker1
          );

          var tx = await ctSessionWorker1.startSessions(
            [supertokenUSDCx],
            [flowRateUSDCx],
            [0]
          );
          var rcpt = await tx.wait();

          const minEndDuration =
            await ctControlDeployer.getMinimumEndDuration();
          const minLifespan = await ctControlDeployer.getMinimumLifespan();
          const amount = ethers.utils.parseEther("600");
          var tx = (await ctUSDCxClient1.approve(
            amMain,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          var tx = (await ctFlowClient1.depositSuperToken(
            supertokenUSDCx,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          const lifespan1 = minEndDuration.add(minLifespan).toNumber() + 5;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan1
          );
          var rcpt = await tx.wait();
          const now1 = await time.latest();

          await time.increase(minLifespan.toNumber());

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
          var rcpt = await tx.wait();
          const now2 = await time.latest();

          const lifespan2 = minEndDuration.add(minLifespan).toNumber() + 100;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan2
          );
          var rcpt = await tx.wait();
          const now3 = await time.latest();
          var rc = await ethers.provider.getTransactionReceipt(
            rcpt.transactionHash
          );
          var block = await ethers.provider.getBlock(rc.blockNumber);
          var startTime = block.timestamp;

          var execData = ctFlowClient1.interface.encodeFunctionData(
            "decreaseFlow",
            [
              supertokenUSDCx,
              client1.address,
              worker1.address,
              1,
              flowRateUSDCx,
            ]
          );
          var timeArgs = encodeTimeArgs(startTime + lifespan2, lifespan2);
          var moduleData = {
            modules: [1, 3],
            args: [timeArgs],
          };

          await time.increase(
            minEndDuration.add(minLifespan).toNumber() + 100 - 1
          );

          await ctGelatoAutoBot
            .connect(gelatoExecutor)
            .exec(
              amMain,
              amMain,
              execData,
              moduleData,
              GELATO_FEE,
              amGelatoFee,
              true,
              true
            );
          const now4 = await time.latest();

          const lifespan3 = minEndDuration.add(minLifespan).toNumber() + 20;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan3
          );
          var rcpt = await tx.wait();
          const now5 = await time.latest();

          await time.increase(minLifespan.toNumber() - 1);

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 2);
          var rcpt = await tx.wait();
          const now6 = await time.latest();

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(0);

          var tx = await ctControlDeployer.realizeFeeBalance(
            1,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 0);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );
          const amountFee1 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(amountFee1);

          var tx = await ctControlDeployer.realizeFeeBalance(
            2,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 1);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );

          const amountFee2 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 2);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );

          const amountFee3 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(amountFee1.add(amountFee2).add(amountFee3));

          const lifespan4 = minEndDuration.add(minLifespan).toNumber() + 7;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan4
          );
          var rcpt = await tx.wait();
          const now7 = await time.latest();

          await time.increase(minLifespan.toNumber());

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 3);
          var rcpt = await tx.wait();
          const now8 = await time.latest();

          const lifespan5 = minEndDuration.add(minLifespan).toNumber() + 7;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan5
          );
          var rcpt = await tx.wait();
          const now9 = await time.latest();

          await expect(
            ctControlDeployer.realizeFeeBalance(2, supertokenUSDCx)
          ).to.be.revertedWithCustomError(ctControlDeployer, "ContractError");

          var tx = await ctControlDeployer.realizeFeeBalance(
            1,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 3);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );

          const amountFee4 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(
            amountFee1.add(amountFee2).add(amountFee3).add(amountFee4)
          );
        });
        it("Should realize even if have some old ended unrealize with some active flow as long as realize call not include active flow counts", async () => {
          const result = await loadFixture(init);
          if (!result) {
            expect(true).to.be.equal(false);
            return;
          }
          const {
            chainId,
            ctUSDCxClient1,
            ctCFAV1,
            ctControlDeployer,
            ctSessionClient1,
            ctFlowClient1,
            ctGelatoAutoBot,
            amMain,
            gelatoExecutor,
            client1,
            worker1,
            worker2,
          } = result;

          const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
          const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
          const flowRateUSDCx = ethers.utils.parseEther("0.00023");
          const flowRateDAIx = ethers.utils.parseEther("0.02");

          const tx720 = await ctControlDeployer.setBPS(
            BPS720,
            FRLB720,
            FRUB720,
            TAG720
          );
          const rcpt720 = await tx720.wait();
          const tx1 = await ctControlDeployer.toggleBPS();
          const rcpt1 = await tx1.wait();

          await fundAppGelatoTresury(
            chainId,
            amMain,
            ethers.utils.parseEther("2")
          );

          const amountInvest = ethers.utils.parseEther("100");
          await investToApp(chainId, amMain, client1, amountInvest);

          const ctSessionWorker1 = await ethers.getContractAt(
            "Session",
            amMain,
            worker1
          );

          var tx = await ctSessionWorker1.startSessions(
            [supertokenUSDCx],
            [flowRateUSDCx],
            [0]
          );
          var rcpt = await tx.wait();

          const minEndDuration =
            await ctControlDeployer.getMinimumEndDuration();
          const minLifespan = await ctControlDeployer.getMinimumLifespan();
          const amount = ethers.utils.parseEther("600");
          var tx = (await ctUSDCxClient1.approve(
            amMain,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          var tx = (await ctFlowClient1.depositSuperToken(
            supertokenUSDCx,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          const lifespan1 = minEndDuration.add(minLifespan).toNumber() + 5;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan1
          );
          var rcpt = await tx.wait();
          const now1 = await time.latest();

          await time.increase(minLifespan.toNumber());

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
          var rcpt = await tx.wait();
          const now2 = await time.latest();

          const lifespan2 = minEndDuration.add(minLifespan).toNumber() + 100;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan2
          );
          var rcpt = await tx.wait();
          const now3 = await time.latest();
          var rc = await ethers.provider.getTransactionReceipt(
            rcpt.transactionHash
          );
          var block = await ethers.provider.getBlock(rc.blockNumber);
          var startTime = block.timestamp;

          var execData = ctFlowClient1.interface.encodeFunctionData(
            "decreaseFlow",
            [
              supertokenUSDCx,
              client1.address,
              worker1.address,
              1,
              flowRateUSDCx,
            ]
          );
          var timeArgs = encodeTimeArgs(startTime + lifespan2, lifespan2);
          var moduleData = {
            modules: [1, 3],
            args: [timeArgs],
          };

          await time.increase(
            minEndDuration.add(minLifespan).toNumber() + 100 - 1
          );

          await ctGelatoAutoBot
            .connect(gelatoExecutor)
            .exec(
              amMain,
              amMain,
              execData,
              moduleData,
              GELATO_FEE,
              amGelatoFee,
              true,
              true
            );
          const now4 = await time.latest();

          const lifespan3 = minEndDuration.add(minLifespan).toNumber() + 20;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan3
          );
          var rcpt = await tx.wait();
          const now5 = await time.latest();

          await time.increase(minLifespan.toNumber() - 1);

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 2);
          var rcpt = await tx.wait();
          const now6 = await time.latest();

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(0);

          var tx = await ctControlDeployer.realizeFeeBalance(
            1,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 0);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );
          const amountFee1 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(amountFee1);

          var tx = await ctControlDeployer.realizeFeeBalance(
            2,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 1);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );

          const amountFee2 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 2);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );

          const amountFee3 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(amountFee1.add(amountFee2).add(amountFee3));

          const lifespan4 = minEndDuration.add(minLifespan).toNumber() + 7;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan4
          );
          var rcpt = await tx.wait();
          const now7 = await time.latest();

          await time.increase(minLifespan.toNumber());

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 3);
          var rcpt = await tx.wait();
          const now8 = await time.latest();

          const lifespan5 = minEndDuration.add(minLifespan).toNumber() + 7;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan5
          );
          var rcpt = await tx.wait();
          const now9 = await time.latest();

          var tx = await ctControlDeployer.realizeFeeBalance(
            1,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 3);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );

          const amountFee4 = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(
            amountFee1.add(amountFee2).add(amountFee3).add(amountFee4)
          );
        });
        it("Should realize the correct amount of fee balance - multi supertokens", async () => {
          const result = await loadFixture(init);
          if (!result) {
            expect(true).to.be.equal(false);
            return;
          }
          const {
            chainId,
            ctUSDCxClient1,
            ctCFAV1,
            ctControlDeployer,
            ctSessionClient1,
            ctFlowClient1,
            ctGelatoAutoBot,
            amMain,
            gelatoExecutor,
            client1,
            client2,
            worker1,
          } = result;

          const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
          const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
          const flowRateUSDCx = ethers.utils.parseEther("0.00023");
          const flowRateDAIx = ethers.utils.parseEther("0.00044");

          var tx = await ctControlDeployer.addSuperToken(supertokenDAIx);
          var rcpt = await tx.wait();

          const tx720 = await ctControlDeployer.setBPS(
            BPS720,
            FRLB720,
            FRUB720,
            TAG720
          );
          const rcpt720 = await tx720.wait();
          const tx1 = await ctControlDeployer.toggleBPS();
          const rcpt1 = await tx1.wait();

          await fundAppGelatoTresury(
            chainId,
            amMain,
            ethers.utils.parseEther("2")
          );

          const amountInvest = ethers.utils.parseEther("100");
          await investToApp(chainId, amMain, client1, amountInvest);

          const ctSessionWorker1 = await ethers.getContractAt(
            "Session",
            amMain,
            worker1
          );

          var tx = await ctSessionWorker1.startSessions(
            [supertokenUSDCx, supertokenDAIx],
            [flowRateUSDCx, flowRateDAIx],
            [0, 1]
          );
          var rcpt = await tx.wait();

          const minEndDuration =
            await ctControlDeployer.getMinimumEndDuration();
          const minLifespan = await ctControlDeployer.getMinimumLifespan();
          const amount = ethers.utils.parseEther("600");
          var tx = (await ctUSDCxClient1.approve(
            amMain,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          var tx = (await ctFlowClient1.depositSuperToken(
            supertokenUSDCx,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          const lifespan = minEndDuration.add(minLifespan).toNumber() + 5;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan
          );
          var rcpt = await tx.wait();
          const now1 = await time.latest();

          //
          const ctFlowClient2 = await ethers.getContractAt(
            "Flow",
            amMain,
            client2
          );
          const ctDAIxClient2 = await ethers.getContractAt(
            ABI_SUPERTOKEN,
            networkConfig[chainId]["addrDAIx"],
            client2
          );

          var tx = (await ctDAIxClient2.approve(
            amMain,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          var tx = (await ctFlowClient2.depositSuperToken(
            supertokenDAIx,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          const lifespan2 = minEndDuration.add(minLifespan).toNumber() + 5;
          var tx = await ctFlowClient2.openFlow(
            worker1.address,
            supertokenDAIx,
            lifespan2
          );
          var rcpt = await tx.wait();

          //

          await time.increase(lifespan + 1);

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
          var rcpt = await tx.wait();

          var tx = await ctFlowClient2.closeFlow(supertokenDAIx, 0);
          var rcpt = await tx.wait();

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(0);
          expect(
            await ctControlDeployer.getFeeBalance(supertokenDAIx)
          ).to.be.equal(0);

          var tx = await ctControlDeployer.realizeFeeBalance(
            1,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();
          var tx = await ctControlDeployer.realizeFeeBalance(1, supertokenDAIx);
          var rcpt = await tx.wait();

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 0);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );
          var amountFee = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(amountFee);

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenDAIx, 0);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenDAIx,
              sesNonce
            );
          var amountFee = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenDAIx)
          ).to.be.equal(amountFee);
        });
      });
      describe("withdrawFeeBalance", async () => {
        it("Should revert if caller not role", async () => {
          const result = await loadFixture(init);
          if (!result) {
            expect(true).to.be.equal(false);
            return;
          }
          const {
            chainId,
            ctUSDCxClient1,
            ctCFAV1,
            ctControlDeployer,
            ctControlClient1,
            ctFlowClient1,
            ctGelatoAutoBot,
            amMain,
            gelatoExecutor,
            client1,
            client2,
            worker1,
          } = result;

          const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
          const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
          const flowRateUSDCx = ethers.utils.parseEther("0.00023");
          const flowRateDAIx = ethers.utils.parseEther("0.00044");

          await expect(
            ctControlClient1.withdrawFeeBalance(
              supertokenUSDCx,
              ethers.utils.parseEther("5")
            )
          ).to.be.reverted;
        });
        it("Should revert if insufficient funds", async () => {
          const result = await loadFixture(init);
          if (!result) {
            expect(true).to.be.equal(false);
            return;
          }
          const {
            chainId,
            ctUSDCxClient1,
            ctCFAV1,
            ctControlDeployer,
            ctSessionClient1,
            ctFlowClient1,
            ctGelatoAutoBot,
            amMain,
            gelatoExecutor,
            client1,
            client2,
            worker1,
          } = result;

          const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
          const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
          const flowRateUSDCx = ethers.utils.parseEther("0.00023");
          const flowRateDAIx = ethers.utils.parseEther("0.00044");

          var tx = await ctControlDeployer.addSuperToken(supertokenDAIx);
          var rcpt = await tx.wait();

          const tx720 = await ctControlDeployer.setBPS(
            BPS720,
            FRLB720,
            FRUB720,
            TAG720
          );
          const rcpt720 = await tx720.wait();
          const tx1 = await ctControlDeployer.toggleBPS();
          const rcpt1 = await tx1.wait();

          await fundAppGelatoTresury(
            chainId,
            amMain,
            ethers.utils.parseEther("2")
          );

          const amountInvest = ethers.utils.parseEther("100");
          await investToApp(chainId, amMain, client1, amountInvest);

          const ctSessionWorker1 = await ethers.getContractAt(
            "Session",
            amMain,
            worker1
          );

          var tx = await ctSessionWorker1.startSessions(
            [supertokenUSDCx, supertokenDAIx],
            [flowRateUSDCx, flowRateDAIx],
            [0, 1]
          );
          var rcpt = await tx.wait();

          const minEndDuration =
            await ctControlDeployer.getMinimumEndDuration();
          const minLifespan = await ctControlDeployer.getMinimumLifespan();
          const amount = ethers.utils.parseEther("600");
          var tx = (await ctUSDCxClient1.approve(
            amMain,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          var tx = (await ctFlowClient1.depositSuperToken(
            supertokenUSDCx,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          const lifespan = minEndDuration.add(minLifespan).toNumber() + 5;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan
          );
          var rcpt = await tx.wait();
          const now1 = await time.latest();

          //
          const ctFlowClient2 = await ethers.getContractAt(
            "Flow",
            amMain,
            client2
          );
          const ctDAIxClient2 = await ethers.getContractAt(
            ABI_SUPERTOKEN,
            networkConfig[chainId]["addrDAIx"],
            client2
          );

          var tx = (await ctDAIxClient2.approve(
            amMain,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          var tx = (await ctFlowClient2.depositSuperToken(
            supertokenDAIx,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          const lifespan2 = minEndDuration.add(minLifespan).toNumber() + 5;
          var tx = await ctFlowClient2.openFlow(
            worker1.address,
            supertokenDAIx,
            lifespan2
          );
          var rcpt = await tx.wait();

          //

          await time.increase(lifespan + 1);

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
          var rcpt = await tx.wait();

          var tx = await ctFlowClient2.closeFlow(supertokenDAIx, 0);
          var rcpt = await tx.wait();

          var tx = await ctControlDeployer.realizeFeeBalance(
            1,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();
          var tx = await ctControlDeployer.realizeFeeBalance(1, supertokenDAIx);
          var rcpt = await tx.wait();

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 0);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );
          var amountFee = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(amountFee);

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenDAIx, 0);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenDAIx,
              sesNonce
            );
          var amountFee = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenDAIx)
          ).to.be.equal(amountFee);

          const amountUSDCx_ = await ctControlDeployer.getFeeBalance(
            supertokenUSDCx
          );
          const amountDAIx_ = await ctControlDeployer.getFeeBalance(
            supertokenDAIx
          );
          const additionalAmount = ethers.utils.parseEther("0.01");

          const amountWithdrawUSDCx = amountUSDCx_.add(additionalAmount);
          const amountWithdrawDAIx = amountDAIx_.add(additionalAmount);
          await expect(
            ctControlDeployer.withdrawFeeBalance(
              supertokenUSDCx,
              amountWithdrawUSDCx
            )
          ).to.be.revertedWithCustomError(
            ctControlDeployer,
            "InsufficientFeeBalance"
          );
          await expect(
            ctControlDeployer.withdrawFeeBalance(
              supertokenDAIx,
              amountWithdrawDAIx
            )
          ).to.be.revertedWithCustomError(
            ctControlDeployer,
            "InsufficientFeeBalance"
          );
        });
        it("Should withdraw correct amount fee balance and update its state", async () => {
          const result = await loadFixture(init);
          if (!result) {
            expect(true).to.be.equal(false);
            return;
          }
          const {
            chainId,
            ctUSDCxClient1,
            ctCFAV1,
            ctControlDeployer,
            ctSessionClient1,
            ctFlowClient1,
            ctGelatoAutoBot,
            amMain,
            gelatoExecutor,
            client1,
            client2,
            worker1,
            deployer,
          } = result;

          const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
          const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
          const flowRateUSDCx = ethers.utils.parseEther("0.00023");
          const flowRateDAIx = ethers.utils.parseEther("0.00044");

          var tx = await ctControlDeployer.addSuperToken(supertokenDAIx);
          var rcpt = await tx.wait();

          const tx720 = await ctControlDeployer.setBPS(
            BPS720,
            FRLB720,
            FRUB720,
            TAG720
          );
          const rcpt720 = await tx720.wait();
          const tx1 = await ctControlDeployer.toggleBPS();
          const rcpt1 = await tx1.wait();

          await fundAppGelatoTresury(
            chainId,
            amMain,
            ethers.utils.parseEther("2")
          );

          const amountInvest = ethers.utils.parseEther("100");
          await investToApp(chainId, amMain, client1, amountInvest);

          const ctSessionWorker1 = await ethers.getContractAt(
            "Session",
            amMain,
            worker1
          );

          var tx = await ctSessionWorker1.startSessions(
            [supertokenUSDCx, supertokenDAIx],
            [flowRateUSDCx, flowRateDAIx],
            [0, 1]
          );
          var rcpt = await tx.wait();

          const minEndDuration =
            await ctControlDeployer.getMinimumEndDuration();
          const minLifespan = await ctControlDeployer.getMinimumLifespan();
          const amount = ethers.utils.parseEther("600");
          var tx = (await ctUSDCxClient1.approve(
            amMain,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          var tx = (await ctFlowClient1.depositSuperToken(
            supertokenUSDCx,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          const lifespan = minEndDuration.add(minLifespan).toNumber() + 5;
          var tx = await ctFlowClient1.openFlow(
            worker1.address,
            supertokenUSDCx,
            lifespan
          );
          var rcpt = await tx.wait();
          const now1 = await time.latest();

          //
          const ctFlowClient2 = await ethers.getContractAt(
            "Flow",
            amMain,
            client2
          );
          const ctDAIxClient2 = await ethers.getContractAt(
            ABI_SUPERTOKEN,
            networkConfig[chainId]["addrDAIx"],
            client2
          );

          var tx = (await ctDAIxClient2.approve(
            amMain,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          var tx = (await ctFlowClient2.depositSuperToken(
            supertokenDAIx,
            amount
          )) as ContractTransaction;
          var rcpt = await tx.wait();

          const lifespan2 = minEndDuration.add(minLifespan).toNumber() + 5;
          var tx = await ctFlowClient2.openFlow(
            worker1.address,
            supertokenDAIx,
            lifespan2
          );
          var rcpt = await tx.wait();

          //

          await time.increase(lifespan + 1);

          var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
          var rcpt = await tx.wait();

          var tx = await ctFlowClient2.closeFlow(supertokenDAIx, 0);
          var rcpt = await tx.wait();

          var tx = await ctControlDeployer.realizeFeeBalance(
            1,
            supertokenUSDCx
          );
          var rcpt = await tx.wait();
          var tx = await ctControlDeployer.realizeFeeBalance(1, supertokenDAIx);
          var rcpt = await tx.wait();

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenUSDCx, 0);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenUSDCx,
              sesNonce
            );
          var amountFee = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenUSDCx)
          ).to.be.equal(amountFee);

          var [receiver, sesNonce, tsIncrease, tsDecrease] =
            await ctControlDeployer.getControlData(supertokenDAIx, 0);
          var [eFlowRate, flowRate, tsStart, tsStop] =
            await ctSessionClient1.getSessionData(
              receiver,
              supertokenDAIx,
              sesNonce
            );
          var amountFee = flowRate
            .sub(eFlowRate)
            .mul(tsDecrease.sub(tsIncrease));

          expect(
            await ctControlDeployer.getFeeBalance(supertokenDAIx)
          ).to.be.equal(amountFee);

          const amountUSDCx_ = await ctControlDeployer.getFeeBalance(
            supertokenUSDCx
          );
          const amountDAIx_ = await ctControlDeployer.getFeeBalance(
            supertokenDAIx
          );
          const additionalAmount = ethers.utils.parseEther("0.01");

          const amountWithdrawUSDCx = amountUSDCx_.sub(additionalAmount);
          const amountWithdrawDAIx = amountDAIx_.sub(additionalAmount);

          const ctDAIxClient1 = await ethers.getContractAt(
            ABI_SUPERTOKEN,
            networkConfig[chainId]["addrDAIx"],
            client1
          );

          const bal1USDCx = await ctUSDCxClient1.balanceOf(amMain);
          const bal1DAIx = await ctDAIxClient1.balanceOf(amMain);
          const bal_USDCx = await ctUSDCxClient1.balanceOf(deployer.address);
          const bal_DAIx = await ctDAIxClient1.balanceOf(deployer.address);

          var tx = await ctControlDeployer.withdrawFeeBalance(
            supertokenUSDCx,
            amountWithdrawUSDCx
          );
          var rcpt = await tx.wait();

          var tx = await ctControlDeployer.withdrawFeeBalance(
            supertokenDAIx,
            amountWithdrawDAIx
          );
          var rcpt = await tx.wait();

          const bal2USDCx = await ctUSDCxClient1.balanceOf(amMain);
          const bal2DAIx = await ctDAIxClient1.balanceOf(amMain);
          const bal_USDCx_ = await ctUSDCxClient1.balanceOf(deployer.address);
          const bal_DAIx_ = await ctDAIxClient1.balanceOf(deployer.address);

          expect(bal2USDCx).to.be.equal(bal1USDCx.sub(amountWithdrawUSDCx));
          expect(bal2DAIx).to.be.equal(bal1DAIx.sub(amountWithdrawDAIx));
          expect(bal_USDCx_).to.be.equal(bal_USDCx.add(amountWithdrawUSDCx));
          expect(bal_DAIx_).to.be.equal(bal_DAIx.add(amountWithdrawDAIx));
        });
      });
    });
  });

  describe("Session", async () => {
    describe("startSession", async () => {
      it("Should revert if supertoken not supported", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctSessionClient1, amMain, client1 } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");
        const flowRateDAIx = ethers.utils.parseEther("0.0002");

        await expect(
          ctSessionClient1.startSession(supertokenDAIx, flowRateDAIx, 0)
        ).to.be.revertedWithCustomError(ctSessionClient1, "InvalidSuperToken");
      });
      it("Should revert if previous session still live", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctSessionClient1, amMain, client1 } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");
        const flowRateDAIx = ethers.utils.parseEther("0.0002");

        var tx = await ctSessionClient1.startSession(
          supertokenUSDCx,
          flowRateUSDCx,
          0
        );
        var rcpt = await tx.wait();

        await expect(
          ctSessionClient1.startSession(supertokenUSDCx, flowRateUSDCx, 0)
        ).to.be.revertedWithCustomError(
          ctSessionClient1,
          "PreviousSessionStillLive"
        );
      });
    });
    describe("startSessions", async () => {
      it("Should revert if array length not match", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctSessionClient1, amMain, client1 } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");

        await expect(
          ctSessionClient1.startSessions(
            [supertokenUSDCx, supertokenDAIx],
            [flowRateUSDCx],
            [0]
          )
        ).to.be.revertedWithCustomError(
          ctSessionClient1,
          "ArrayLengthNotMatch"
        );
      });
      it("Should revert if supertoken not supported", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctSessionClient1, amMain, client1 } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");
        const flowRateDAIx = ethers.utils.parseEther("0.0002");

        await expect(
          ctSessionClient1.startSessions(
            [supertokenUSDCx, supertokenDAIx],
            [flowRateUSDCx, flowRateDAIx],
            [0, 0]
          )
        ).to.be.revertedWithCustomError(ctSessionClient1, "InvalidSuperToken");
      });
      it("Should revert if previous session still live", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctSessionClient1, amMain, client1 } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");
        const flowRateDAIx = ethers.utils.parseEther("0.0002");

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        await expect(
          ctSessionClient1.startSessions(
            [supertokenUSDCx],
            [flowRateUSDCx],
            [0]
          )
        ).to.be.revertedWithCustomError(
          ctSessionClient1,
          "PreviousSessionStillLive"
        );

        await expect(
          ctSessionClient1.startSessions(
            [supertokenUSDCx, supertokenDAIx],
            [flowRateUSDCx, flowRateDAIx],
            [0, 0]
          )
        ).to.be.revertedWithCustomError(
          ctSessionClient1,
          "PreviousSessionStillLive"
        );
      });
      it("Should start session and set states and ignore bps (flowrate = eflowrate) as (not enabled/not set/user not sbps)", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctSessionClient1, amMain, client1 } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(0);
        expect(currentSuperTokens.length).to.be.equal(0);

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(1);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateUSDCx);
        expect(flowRate).to.be.equal(flowRateUSDCx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(now1);
        expect(currentSuperTokens.length).to.be.equal(1);
        expect(currentSuperTokens.at(0)).to.be.equal(supertokenUSDCx);
      });
      it("Should revert if bps enabled but (not set/user not sbps)", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctSessionClient1,
          ctControlDeployer,
          amMain,
          client1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");

        expect(await ctControlDeployer.isBPSEnabled()).to.be.equal(false);
        const tx1 = await ctControlDeployer.toggleBPS();
        const rcpt1 = await tx1.wait();
        expect(await ctControlDeployer.isBPSEnabled()).to.be.equal(true);

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(0);
        expect(currentSuperTokens.length).to.be.equal(0);

        await expect(
          ctSessionClient1.startSessions(
            [supertokenUSDCx],
            [flowRateUSDCx],
            [0]
          )
        ).to.be.revertedWithCustomError(ctSessionClient1, "InvalidFlowRate");
      });
      it("Should start session and ignore bps even if bps set as (not enabled/user not sbps)", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctSessionClient1,
          ctControlDeployer,
          amMain,
          client1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");

        expect(await ctControlDeployer.getBPSSize()).to.be.equal(0);
        for (let i = 0; i < TAG720.length; i++) {
          const tag = TAG720[i];
          const [bps_, frlb_, frub_] = await ctControlDeployer.getBPSData(tag);
          expect(bps_).to.be.equal(0);
          expect(frlb_).to.be.equal(0);
          expect(frub_).to.be.equal(0);
        }

        const tx720 = await ctControlDeployer.setBPS(
          BPS720,
          FRLB720,
          FRUB720,
          TAG720
        );
        const rcpt720 = await tx720.wait();

        expect(await ctControlDeployer.getBPSSize()).to.be.equal(TAG720.length);
        for (let i = 0; i < TAG720.length; i++) {
          const tag = TAG720[i];
          const bps = BPS720[i];
          const frlb = FRLB720[i];
          const frub = FRUB720[i];
          const [bps_, frlb_, frub_] = await ctControlDeployer.getBPSData(tag);
          expect(bps_).to.be.equal(bps);
          expect(frlb_).to.be.equal(frlb);
          expect(frub_).to.be.equal(frub);
        }

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(0);
        expect(currentSuperTokens.length).to.be.equal(0);

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(1);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateUSDCx);
        expect(flowRate).to.be.equal(flowRateUSDCx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(now1);
        expect(currentSuperTokens.length).to.be.equal(1);
        expect(currentSuperTokens.at(0)).to.be.equal(supertokenUSDCx);
      });
      it("Should start session and use bps as bps enabled (before set) and bps set (user not sbps)", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctSessionClient1,
          ctControlDeployer,
          amMain,
          client1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.000226"); // 0.0001

        const tx1 = await ctControlDeployer.toggleBPS();
        const rcpt1 = await tx1.wait();
        const tx720 = await ctControlDeployer.setBPS(
          BPS720,
          FRLB720,
          FRUB720,
          TAG720
        );
        const rcpt720 = await tx720.wait();

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(0);
        expect(currentSuperTokens.length).to.be.equal(0);

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(1);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateUSDCx.mul(BPS720[0]).div(10000));
        expect(flowRate).to.be.equal(flowRateUSDCx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(now1);
        expect(currentSuperTokens.length).to.be.equal(1);
        expect(currentSuperTokens.at(0)).to.be.equal(supertokenUSDCx);
      });
      it("Should start session and use bps as bps enabled (after set) and bps set (user not sbps)", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctSessionClient1,
          ctControlDeployer,
          amMain,
          client1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.000226"); // 0.0001

        const tx720 = await ctControlDeployer.setBPS(
          BPS720,
          FRLB720,
          FRUB720,
          TAG720
        );
        const rcpt720 = await tx720.wait();
        const tx1 = await ctControlDeployer.toggleBPS();
        const rcpt1 = await tx1.wait();

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(0);
        expect(currentSuperTokens.length).to.be.equal(0);

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(1);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateUSDCx.mul(BPS720[0]).div(10000));
        expect(flowRate).to.be.equal(flowRateUSDCx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(now1);
        expect(currentSuperTokens.length).to.be.equal(1);
        expect(currentSuperTokens.at(0)).to.be.equal(supertokenUSDCx);
      });
      it("Should revert with invalid flow rate after bps enabled  and bps set (user not sbps) - flow rate lower", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctSessionClient1,
          ctControlDeployer,
          amMain,
          client1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001"); // 0.0001

        const tx720 = await ctControlDeployer.setBPS(
          BPS720,
          FRLB720,
          FRUB720,
          TAG720
        );
        const rcpt720 = await tx720.wait();
        const tx1 = await ctControlDeployer.toggleBPS();
        const rcpt1 = await tx1.wait();

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(0);
        expect(currentSuperTokens.length).to.be.equal(0);

        await expect(
          ctSessionClient1.startSessions(
            [supertokenUSDCx],
            [flowRateUSDCx],
            [0]
          )
        ).to.be.revertedWithCustomError(ctSessionClient1, "InvalidFlowRate");
      });
      it("Should revert with invalid flow rate after bps enabled  and bps set (user not sbps) - flow rate higher", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctSessionClient1,
          ctControlDeployer,
          amMain,
          client1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0004"); // 0.0001

        const tx720 = await ctControlDeployer.setBPS(
          BPS720,
          FRLB720,
          FRUB720,
          TAG720
        );
        const rcpt720 = await tx720.wait();
        const tx1 = await ctControlDeployer.toggleBPS();
        const rcpt1 = await tx1.wait();

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(0);
        expect(currentSuperTokens.length).to.be.equal(0);

        await expect(
          ctSessionClient1.startSessions(
            [supertokenUSDCx],
            [flowRateUSDCx],
            [0]
          )
        ).to.be.revertedWithCustomError(ctSessionClient1, "InvalidFlowRate");
      });
      it("Should revert with invalid flow rate after bps enabled  and bps set (user not sbps) - flow rate lower - different tag", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctSessionClient1,
          ctControlDeployer,
          amMain,
          client1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.00044"); // 0.0001

        const tx720 = await ctControlDeployer.setBPS(
          BPS720,
          FRLB720,
          FRUB720,
          TAG720
        );
        const rcpt720 = await tx720.wait();
        const tx1 = await ctControlDeployer.toggleBPS();
        const rcpt1 = await tx1.wait();

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(0);
        expect(currentSuperTokens.length).to.be.equal(0);

        await expect(
          ctSessionClient1.startSessions(
            [supertokenUSDCx],
            [flowRateUSDCx],
            [2]
          )
        ).to.be.revertedWithCustomError(ctSessionClient1, "InvalidFlowRate");
      });
      it("Should revert with invalid flow rate after bps enabled  and bps set (user not sbps) - flow rate higher - different tag", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctSessionClient1,
          ctControlDeployer,
          amMain,
          client1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0009"); // 0.0001

        const tx720 = await ctControlDeployer.setBPS(
          BPS720,
          FRLB720,
          FRUB720,
          TAG720
        );
        const rcpt720 = await tx720.wait();
        const tx1 = await ctControlDeployer.toggleBPS();
        const rcpt1 = await tx1.wait();

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(0);
        expect(currentSuperTokens.length).to.be.equal(0);

        await expect(
          ctSessionClient1.startSessions(
            [supertokenUSDCx],
            [flowRateUSDCx],
            [2]
          )
        ).to.be.revertedWithCustomError(ctSessionClient1, "InvalidFlowRate");
      });
      it("Should start session and use bps as user is sbps, even if (bps not enabled/set)", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctSessionClient1,
          ctControlDeployer,
          amMain,
          client1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");

        expect(await ctControlDeployer.getSBPS(client1.address)).to.be.equal(0);
        const v = 7000;
        var tx = await ctControlDeployer.setSBPS(v, client1.address);
        var rcpt = await tx.wait();
        expect(await ctControlDeployer.getSBPS(client1.address)).to.be.equal(v);

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(0);
        expect(currentSuperTokens.length).to.be.equal(0);

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(1);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateUSDCx.mul(v).div(10000));
        expect(flowRate).to.be.equal(flowRateUSDCx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(now1);
        expect(currentSuperTokens.length).to.be.equal(1);
        expect(currentSuperTokens.at(0)).to.be.equal(supertokenUSDCx);
      });
      it("Should start session and use bps as user is sbps, even if (bps is enabled/set)", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctSessionClient1,
          ctControlDeployer,
          amMain,
          client1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");

        const tx720 = await ctControlDeployer.setBPS(
          BPS720,
          FRLB720,
          FRUB720,
          TAG720
        );
        const rcpt720 = await tx720.wait();
        const tx1 = await ctControlDeployer.toggleBPS();
        const rcpt1 = await tx1.wait();

        const v = 7000;
        var tx = await ctControlDeployer.setSBPS(v, client1.address);
        var rcpt = await tx.wait();

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(0);
        expect(currentSuperTokens.length).to.be.equal(0);

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(1);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateUSDCx.mul(v).div(10000));
        expect(flowRate).to.be.equal(flowRateUSDCx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(now1);
        expect(currentSuperTokens.length).to.be.equal(1);
        expect(currentSuperTokens.at(0)).to.be.equal(supertokenUSDCx);
      });
      it("Should start multiple same sessions with different supertoken", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctControlDeployer,
          ctSessionClient1,
          amMain,
          client1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.00044");
        const flowRateDAIx = ethers.utils.parseEther("0.0018");

        const tx720 = await ctControlDeployer.setBPS(
          BPS720,
          FRLB720,
          FRUB720,
          TAG720
        );
        const rcpt720 = await tx720.wait();
        const tx1 = await ctControlDeployer.toggleBPS();
        const rcpt1 = await tx1.wait();

        var tx = await ctControlDeployer.addSuperToken(supertokenDAIx);
        var rcpt = await tx.wait();

        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenDAIx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);

        // check that both st session is null

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx, supertokenDAIx],
          [flowRateUSDCx, flowRateDAIx],
          [1, 5]
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateUSDCx.mul(BPS720[1]).div(10000));
        expect(flowRate).to.be.equal(flowRateUSDCx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenDAIx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateDAIx.mul(BPS720[5]).div(10000));
        expect(flowRate).to.be.equal(flowRateDAIx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(0);
      });
      it("Should start multiple sessions with different supertoken from different broadcasters", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctControlDeployer,
          ctSessionClient1,
          amMain,
          client1,
          client2,
        } = result;

        const ctSessionClient2 = await ethers.getContractAt(
          "Session",
          amMain,
          client2
        );

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0008");
        const flowRateDAIx = ethers.utils.parseEther("0.001");

        const tx720 = await ctControlDeployer.setBPS(
          BPS720,
          FRLB720,
          FRUB720,
          TAG720
        );
        const rcpt720 = await tx720.wait();
        const tx1 = await ctControlDeployer.toggleBPS();
        const rcpt1 = await tx1.wait();

        var tx = await ctControlDeployer.addSuperToken(supertokenDAIx);
        var rcpt = await tx.wait();

        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenDAIx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient2.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient2.getSessionData(
            client1.address,
            supertokenDAIx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx, supertokenDAIx],
          [flowRateUSDCx, flowRateDAIx],
          [3, 4]
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        const flowRateDAIx2 = ethers.utils.parseEther("0.00029");
        var tx = await ctSessionClient2.startSessions(
          [supertokenDAIx],
          [flowRateDAIx2],
          [0]
        );
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateUSDCx.mul(BPS720[3]).div(10000));
        expect(flowRate).to.be.equal(flowRateUSDCx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenDAIx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateDAIx.mul(BPS720[4]).div(10000));
        expect(flowRate).to.be.equal(flowRateDAIx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient2.getSessionData(
            client2.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient2.getSessionData(
            client2.address,
            supertokenDAIx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateDAIx2.mul(BPS720[0]).div(10000));
        expect(flowRate).to.be.equal(flowRateDAIx2);
        expect(timestampStart).to.be.equal(now2);
        expect(timestampStop).to.be.equal(0);
      });
    });
    describe("stopSessions", async () => {
      //   it("Should revert if supertoken not supported", async () => {
      //     const result = await loadFixture(init);
      //     if (!result) {
      //       expect(true).to.be.equal(false);
      //       return;
      //     }
      //     const { chainId, ctSessionClient1, amMain, client1 } = result;

      //     const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
      //     const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
      //     const flowRateUSDCx = ethers.utils.parseEther("0.0001");
      //     const flowRateDAIx = ethers.utils.parseEther("0.0002");

      //     await expect(
      //       ctSessionClient1.stopSessions([supertokenDAIx])
      //     ).to.be.revertedWithCustomError(ctSessionClient1, "InvalidSuperToken");
      //   });
      it("Should revert if session not started", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctSessionClient1, amMain, client1 } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];

        await expect(
          ctSessionClient1.stopSessions([supertokenUSDCx])
        ).to.be.revertedWithCustomError(ctSessionClient1, "SessionNotStarted");
      });
      it("Should revert if session already ended", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctSessionClient1, amMain, client1 } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        var tx = await ctSessionClient1.stopSessions([supertokenUSDCx]);
        var rcpt = await tx.wait();

        await expect(
          ctSessionClient1.stopSessions([supertokenUSDCx])
        ).to.be.revertedWithCustomError(
          ctSessionClient1,
          "SessionAlreadyEnded"
        );
      });
      it("Should delete incoming flow to session host and update state", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctSessionClient1, amMain, client1 } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(1);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateUSDCx);
        expect(flowRate).to.be.equal(flowRateUSDCx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(now1);
        expect(currentSuperTokens.length).to.be.equal(1);
        expect(currentSuperTokens.at(0)).to.be.equal(supertokenUSDCx);

        var tx = await ctSessionClient1.stopSessions([supertokenUSDCx]);
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(1);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateUSDCx);
        expect(flowRate).to.be.equal(flowRateUSDCx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(now2);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSuperTokens.length).to.be.equal(0);
      });
      it("Should stop multiple same sessions with different supertoken", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctControlDeployer,
          ctSessionClient1,
          amMain,
          client1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");
        const flowRateDAIx = ethers.utils.parseEther("0.0002");

        var tx = await ctControlDeployer.addSuperToken(supertokenDAIx);
        var rcpt = await tx.wait();

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx, supertokenDAIx],
          [flowRateUSDCx, flowRateDAIx],
          [0, 0]
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateUSDCx);
        expect(flowRate).to.be.equal(flowRateUSDCx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenDAIx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateDAIx);
        expect(flowRate).to.be.equal(flowRateDAIx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(0);

        // stop session
        var tx = await ctSessionClient1.stopSessions([
          supertokenUSDCx,
          supertokenDAIx,
        ]);
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateUSDCx);
        expect(flowRate).to.be.equal(flowRateUSDCx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(now2);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenDAIx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateDAIx);
        expect(flowRate).to.be.equal(flowRateDAIx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(now2);
      });
      it("Should fail the existing flow scheduled for auto deletion during execution", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          client2,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.001");
        const flowRateDAIx = ethers.utils.parseEther("0.002");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minEndDuration = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600"); //minLifespan.mul(flowRateUSDCx.add(minEndDuration));
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();
        var rc = await ethers.provider.getTransactionReceipt(
          rcpt.transactionHash
        );
        var block = await ethers.provider.getBlock(rc.blockNumber);
        var startTime = block.timestamp;

        const execData = ctFlowClient1.interface.encodeFunctionData(
          "decreaseFlow",
          [supertokenUSDCx, client1.address, worker1.address, 0, flowRateUSDCx]
        );
        var timeArgs = encodeTimeArgs(startTime + lifespan, lifespan);
        const moduleData = {
          modules: [1, 3],
          args: [timeArgs],
        };

        const ctFlowClient2 = await ethers.getContractAt(
          "Flow",
          amMain,
          client2
        );
        const ctUSDCxClient2 = await ethers.getContractAt(
          ABI_SUPERTOKEN,
          networkConfig[chainId]["addrUSDCx"],
          client2
        );

        var tx = (await ctUSDCxClient2.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient2.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var lifespan = 280;
        var tx = await ctFlowClient2.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now2 = await time.latest();
        var rc = await ethers.provider.getTransactionReceipt(
          rcpt.transactionHash
        );
        var block = await ethers.provider.getBlock(rc.blockNumber);
        var startTime = block.timestamp;

        const execData2 = ctFlowClient1.interface.encodeFunctionData(
          "decreaseFlow",
          [supertokenUSDCx, client1.address, worker1.address, 0, flowRateUSDCx]
        );
        var timeArgs = encodeTimeArgs(startTime + lifespan, lifespan);
        const moduleData2 = {
          modules: [1, 3],
          args: [timeArgs],
        };

        await time.increase(260); // ff time

        var tx = await ctSessionWorker1.stopSessions([supertokenUSDCx]);
        var rcpt = await tx.wait();
        const now3 = await time.latest();

        await expect(
          ctGelatoAutoBot
            .connect(gelatoExecutor)
            .exec(
              amMain,
              amMain,
              execData,
              moduleData,
              GELATO_FEE,
              amGelatoFee,
              true,
              true
            )
        ).to.be.revertedWith("Automate.exec: NoErrorSelector");

        await time.increase(35); // ff time

        await expect(
          ctGelatoAutoBot
            .connect(gelatoExecutor)
            .exec(
              amMain,
              amMain,
              execData2,
              moduleData2,
              GELATO_FEE,
              amGelatoFee,
              true,
              true
            )
        ).to.be.revertedWith("Automate.exec: NoErrorSelector");
      });
      it("Should stop flow as usual - setting of bps should not affect anything", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctSessionClient1,
          ctControlDeployer,
          amMain,
          client1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.00029");

        const tx720 = await ctControlDeployer.setBPS(
          BPS720,
          FRLB720,
          FRUB720,
          TAG720
        );
        const rcpt720 = await tx720.wait();
        const tx1 = await ctControlDeployer.toggleBPS();
        const rcpt1 = await tx1.wait();

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(1);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateUSDCx.mul(BPS720[0]).div(10000));
        expect(flowRate).to.be.equal(flowRateUSDCx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(0);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(now1);
        expect(currentSuperTokens.length).to.be.equal(1);
        expect(currentSuperTokens.at(0)).to.be.equal(supertokenUSDCx);

        var tx = await ctSessionClient1.stopSessions([supertokenUSDCx]);
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(1);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateUSDCx.mul(BPS720[0]).div(10000));
        expect(flowRate).to.be.equal(flowRateUSDCx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(now2);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSuperTokens.length).to.be.equal(0);
      });
    });
    describe("getNewSessionNonce", async () => {
      it("Should get new nonce", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctSessionClient1, amMain, client1 } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");
        const flowRateDAIx = ethers.utils.parseEther("0.0002");

        var newNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newNonce).to.be.equal(0);

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        var newNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newNonce).to.be.equal(1);
      });
    });
    describe("session start/stop with variable supertoken", async () => {
      it("Should run smoothly", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctControlDeployer,
          ctSessionClient1,
          amMain,
          client1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");
        const flowRateDAIx = ethers.utils.parseEther("0.0002");

        var tx = await ctControlDeployer.addSuperToken(supertokenDAIx);
        var rcpt = await tx.wait();

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(now1);
        expect(currentSuperTokens.length).to.be.equal(1);

        // stop session
        var tx = await ctSessionClient1.stopSessions([
          supertokenUSDCx,
          //   supertokenDAIx,
        ]);
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateUSDCx);
        expect(flowRate).to.be.equal(flowRateUSDCx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(now2);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenDAIx,
            0
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            1
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenDAIx,
            1
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(1);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(0);
        expect(currentSuperTokens.length).to.be.equal(0);

        // 2nd session

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx, supertokenDAIx],
          [flowRateUSDCx, flowRateDAIx],
          [0, 0]
        );
        var rcpt = await tx.wait();
        const now3 = await time.latest();

        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(now3);
        expect(currentSuperTokens.length).to.be.equal(2);
        expect(currentSuperTokens.at(0)).to.be.equal(supertokenUSDCx);
        expect(currentSuperTokens.at(1)).to.be.equal(supertokenDAIx);

        var tx = await ctSessionClient1.stopSessions([
          supertokenUSDCx,
          supertokenDAIx,
        ]);
        var rcpt = await tx.wait();
        const now4 = await time.latest();

        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            0
          );
        expect(eFlowRate).to.be.equal(flowRateUSDCx);
        expect(flowRate).to.be.equal(flowRateUSDCx);
        expect(timestampStart).to.be.equal(now1);
        expect(timestampStop).to.be.equal(now2);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenDAIx,
            0
          );
        expect(flowRate).to.be.equal(flowRateDAIx);
        expect(timestampStart).to.be.equal(now3);
        expect(timestampStop).to.be.equal(now4);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenUSDCx,
            1
          );
        expect(eFlowRate).to.be.equal(flowRateUSDCx);
        expect(flowRate).to.be.equal(flowRateUSDCx);
        expect(timestampStart).to.be.equal(now3);
        expect(timestampStop).to.be.equal(now4);
        var [eFlowRate, flowRate, timestampStart, timestampStop] =
          await ctSessionClient1.getSessionData(
            client1.address,
            supertokenDAIx,
            1
          );
        expect(eFlowRate).to.be.equal(0);
        expect(flowRate).to.be.equal(0);
        expect(timestampStart).to.be.equal(0);
        expect(timestampStop).to.be.equal(0);

        var newSessionNonce = await ctSessionClient1.getNewSessionNonce(
          client1.address,
          supertokenUSDCx
        );
        expect(newSessionNonce).to.be.equal(2);
        var [currentSessionTimestamp, currentSuperTokens] =
          await ctSessionClient1.getCurrentSessionData(client1.address);
        expect(currentSessionTimestamp).to.be.equal(0);
        expect(currentSuperTokens.length).to.be.equal(0);
      });
    });
  });

  describe("Flow", async () => {
    describe("depositSuperToken", async () => {
      it("Should revert if supertoken not supported", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctFlowClient1, amMain, client1 } = result;

        const supertoken = networkConfig[chainId]["addrDAIx"];
        const amount = ethers.utils.parseEther("3");
        await expect(
          ctFlowClient1.depositSuperToken(supertoken, amount)
        ).to.be.revertedWithCustomError(ctFlowClient1, "InvalidSuperToken");
      });
      it("Should increase supertoken balance", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctFlowClient1, ctUSDCxClient1, amMain, client1 } =
          result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const amount = ethers.utils.parseEther("3");

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenDAIx)
        ).to.be.equal(0);

        var tx = await ctUSDCxClient1.approve(amMain, amount);
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as any;
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenDAIx)
        ).to.be.equal(0);
      });
    });
    describe("_getAmountFlowed", async () => {
      it("Should return 0 if not open flow yet (new nonce = 0)", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
      });
      it("Should return 0 if in the middle of flow (first flow)", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minEndDuration = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
      });
      it("Should return more than 0 after first flow", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();
        var rc = await ethers.provider.getTransactionReceipt(
          rcpt.transactionHash
        );
        var block = await ethers.provider.getBlock(rc.blockNumber);
        var startTime = block.timestamp;

        var execData = ctFlowClient1.interface.encodeFunctionData(
          "decreaseFlow",
          [supertokenUSDCx, client1.address, worker1.address, 0, flowRateUSDCx]
        );
        var timeArgs = encodeTimeArgs(startTime + lifespan, lifespan);
        var moduleData = {
          modules: [1, 3],
          args: [timeArgs],
        };

        const fft = minLifespan.sub(1).toNumber();
        await time.increase(fft);

        var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(flowRateUSDCx.mul(fft + 1));
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(flowRateUSDCx.mul(now2 - now1));
      });
      it(
        "GOTO REF1/2 - Should return 0 if in the middle of flow (beyond first flow)"
      );
      it("GOTO REF1/2 - Should return more than 0 after multiple flows");
    });
    describe("openFlow", async () => {
      it("Should revert if app insufficient gelato balance", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");
        const flowRateDAIx = ethers.utils.parseEther("0.0002");

        const lifespan = 60;
        await expect(
          ctFlowClient1.openFlow(worker1.address, supertokenUSDCx, lifespan)
        ).to.be.revertedWithCustomError(
          ctFlowClient1,
          "InsufficientAppGelatoBalance"
        );
      });
      it("Should revert supertoken not supported", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");
        const flowRateDAIx = ethers.utils.parseEther("0.0002");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const lifespan = 60;
        await expect(
          ctFlowClient1.openFlow(worker1.address, supertokenDAIx, lifespan)
        ).to.be.revertedWithCustomError(ctFlowClient1, "InvalidSuperToken");
      });
      it("Should revert if session not started", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");
        const flowRateDAIx = ethers.utils.parseEther("0.0002");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const lifespan = 60;
        await expect(
          ctFlowClient1.openFlow(worker1.address, supertokenUSDCx, lifespan)
        ).to.be.revertedWithCustomError(ctFlowClient1, "SessionNotStarted");
      });
      it("Should revert if insufficient app supertoken balance", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const amount = minBalance.add(ethers.utils.parseEther("0.0001"));
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 60;
        await expect(
          ctFlowClient1.openFlow(worker1.address, supertokenUSDCx, lifespan)
        ).to.be.revertedWithCustomError(
          ctFlowClient1,
          "InsufficientAppSTBalance"
        );
      });
      it("Should revert if lifespan from balance less than end duration", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minEndDuration = await ctControlDeployer.getMinimumEndDuration();
        const duration = minEndDuration.sub(1);
        const amount = flowRateUSDCx.mul(duration);
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 60;
        await expect(
          ctFlowClient1.openFlow(worker1.address, supertokenUSDCx, lifespan)
        ).to.be.revertedWithCustomError(ctFlowClient1, "InsufficientLifespan1");
      });
      it("Should revert if lifespan from balance less than min lifespan", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minEndDuration = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const duration = minEndDuration.add(minLifespan).sub(5);
        const amount = flowRateUSDCx.mul(duration);
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 60;
        await expect(
          ctFlowClient1.openFlow(worker1.address, supertokenUSDCx, lifespan)
        ).to.be.revertedWithCustomError(ctFlowClient1, "InsufficientLifespan2");
      });
      it("Should revert if lifespan set less than min lifespan + end duration", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minEndDuration = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 60;
        await expect(
          ctFlowClient1.openFlow(worker1.address, supertokenUSDCx, lifespan)
        ).to.be.revertedWithCustomError(ctFlowClient1, "InsufficientLifespan3");
      });
      it("Should set flow states, create flow from app to receiver", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minEndDuration = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(0);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(ethers.constants.AddressZero);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(0);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(ethers.constants.HashZero);
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(0);
        expect(flowRateOutput).to.be.equal(0);
        expect(deposit).to.be.equal(0);
        expect(owedDeposit).to.be.equal(0);

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(1);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(taskIds.at(0));
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(now1);
        expect(flowRateOutput).to.be.equal(flowRateUSDCx);
        expect(deposit).to.be.gt(flowRateUSDCx.mul(60 * 60));
        expect(owedDeposit).to.be.equal(0);

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
      });
      it("Should set flow states, create flow from app to receiver - bps", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.00023");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        const tx720 = await ctControlDeployer.setBPS(
          BPS720,
          FRLB720,
          FRUB720,
          TAG720
        );
        const rcpt720 = await tx720.wait();
        const tx1 = await ctControlDeployer.toggleBPS();
        const rcpt1 = await tx1.wait();

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minEndDuration = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(0);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(ethers.constants.AddressZero);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(0);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(ethers.constants.HashZero);
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(0);
        expect(flowRateOutput).to.be.equal(0);
        expect(deposit).to.be.equal(0);
        expect(owedDeposit).to.be.equal(0);

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(1);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(taskIds.at(0));
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(now1);
        expect(flowRateOutput).to.be.equal(
          flowRateUSDCx.mul(BPS720[0]).div(10000)
        );
        expect(deposit).to.be.gt(
          flowRateUSDCx
            .mul(BPS720[0])
            .div(10000)
            .mul(60 * 60)
        );
        expect(owedDeposit).to.be.equal(0);

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
      });
      it("Should open flow from another user, update flow from app to receiver if there is an existing session", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          client2,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(1);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(taskIds.at(0));
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client2.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(ethers.constants.AddressZero);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(0);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(ethers.constants.HashZero);
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(now1);
        expect(flowRateOutput).to.be.equal(flowRateUSDCx);
        expect(deposit).to.be.gt(flowRateUSDCx.mul(60 * 60));
        expect(owedDeposit).to.be.equal(0);

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);

        const ctFlowClient2 = await ethers.getContractAt(
          "Flow",
          amMain,
          client2
        );
        const ctUSDCxClient2 = await ethers.getContractAt(
          ABI_SUPERTOKEN,
          networkConfig[chainId]["addrUSDCx"],
          client2
        );

        var tx = (await ctUSDCxClient2.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient2.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient2.getDepositUser(client2.address, supertokenUSDCx)
        ).to.be.equal(amount);

        var lifespan = 250;
        var tx = await ctFlowClient2.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(2);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(taskIds.at(0));
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client2.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now2);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(taskIds.at(1));
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(now2);
        expect(flowRateOutput).to.be.equal(flowRateUSDCx.mul(2));
        expect(deposit).to.be.gt(flowRateUSDCx.mul(2).mul(60 * 60));
        expect(owedDeposit).to.be.equal(0);

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);

        expect(
          await ctFlowClient2.getDepositUser(client2.address, supertokenUSDCx)
        ).to.be.equal(amount);
      });
      it("Should revert if (has active flow) open multiple flows from single viewer to different broadcaster session", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(1);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(taskIds.at(0));
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(now1);
        expect(flowRateOutput).to.be.equal(flowRateUSDCx);
        expect(deposit).to.be.gt(flowRateUSDCx.mul(60 * 60));
        expect(owedDeposit).to.be.equal(0);

        var lifespan = 250;
        await expect(
          ctFlowClient1.openFlow(worker1.address, supertokenUSDCx, lifespan)
        ).to.be.revertedWithCustomError(ctFlowClient1, "HasActiveFlow");

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(1);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(taskIds.at(0));
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(now1);
        expect(flowRateOutput).to.be.equal(flowRateUSDCx);
        expect(deposit).to.be.gt(flowRateUSDCx.mul(60 * 60));
        expect(owedDeposit).to.be.equal(0);
      });
      it("REF1 - Should reduce amount balance after second open flow", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minEndDuration = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        const fft = minLifespan.sub(1).toNumber();
        await time.increase(fft);

        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);

        var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(flowRateUSDCx.mul(now2 - now1));

        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now3 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount.sub(flowRateUSDCx.mul(now2 - now1)));
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
      });
      it("REF2 - Should reduce amount balance after third open flow", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minEndDuration = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var fft = minLifespan.sub(1).toNumber();
        await time.increase(fft);

        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);

        var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(flowRateUSDCx.mul(now2 - now1));

        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now3 = await time.latest();

        var fft = minLifespan.sub(1).toNumber();
        await time.increase(fft);

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount.sub(flowRateUSDCx.mul(now2 - now1)));
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);

        var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 1);
        var rcpt = await tx.wait();
        const now4 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount.sub(flowRateUSDCx.mul(now4 - now3)));
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(flowRateUSDCx.mul(now4 - now3));

        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now5 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(
          amount
            .sub(flowRateUSDCx.mul(now2 - now1))
            .sub(flowRateUSDCx.mul(now4 - now3))
        );
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
      });
    });
    describe("decreaseFlow", async () => {
      it("Should revert if caller not role", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const { chainId, ctAutomateDeployer, ctAutomateClient1, client1 } =
          result;

        await expect(ctAutomateDeployer.setGelatoContracts(amGelatoFee)).to.be
          .reverted;
        await expect(ctAutomateClient1.setGelatoContracts(amGelatoFee)).to.be
          .reverted;
      });
      it("Should auto decrease flow if lifespan reached - delete flow if no other viewer and only last for viewer's set lifespan", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;
        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );
        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();
        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(0);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(ethers.constants.AddressZero);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(0);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(ethers.constants.HashZero);
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(0);
        expect(flowRateOutput).to.be.equal(0);
        expect(deposit).to.be.equal(0);
        expect(owedDeposit).to.be.equal(0);

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();
        var rc = await ethers.provider.getTransactionReceipt(
          rcpt.transactionHash
        );
        var block = await ethers.provider.getBlock(rc.blockNumber);
        var startTime = block.timestamp;

        var execData = ctFlowClient1.interface.encodeFunctionData(
          "decreaseFlow",
          [supertokenUSDCx, client1.address, worker1.address, 0, flowRateUSDCx]
        );
        var timeArgs = encodeTimeArgs(startTime + lifespan, lifespan);
        var moduleData = {
          modules: [1, 3],
          args: [timeArgs],
        };

        await time.increase(260); // ff time

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(1);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(taskIds.at(0));
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(now1);
        expect(flowRateOutput).to.be.equal(flowRateUSDCx);
        expect(deposit).to.be.gt(flowRateUSDCx.mul(60 * 60));
        expect(owedDeposit).to.be.equal(0);

        await ctGelatoAutoBot
          .connect(gelatoExecutor)
          .exec(
            amMain,
            amMain,
            execData,
            moduleData,
            GELATO_FEE,
            amGelatoFee,
            true,
            true
          );
        const tsDecreaseFlow = await time.latest();

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(0);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(tsDecreaseFlow);
        expect(taskId).to.not.be.equal(ethers.constants.HashZero);
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(0);
        expect(flowRateOutput).to.be.equal(0);
        expect(deposit).to.be.equal(0);
        expect(owedDeposit).to.be.equal(0);
      });
      it("Should auto decrease flow only last for max lifespan although viewer's set lifespan is longer", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;
        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );
        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();
        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(0);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(ethers.constants.AddressZero);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(0);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(ethers.constants.HashZero);
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(0);
        expect(flowRateOutput).to.be.equal(0);
        expect(deposit).to.be.equal(0);
        expect(owedDeposit).to.be.equal(0);

        const lifespan = 100000;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();
        var rc = await ethers.provider.getTransactionReceipt(
          rcpt.transactionHash
        );
        var block = await ethers.provider.getBlock(rc.blockNumber);
        var startTime = block.timestamp;

        var execData = ctFlowClient1.interface.encodeFunctionData(
          "decreaseFlow",
          [supertokenUSDCx, client1.address, worker1.address, 0, flowRateUSDCx]
        );
        const safeLifespan = (
          await ctFlowClient1.getValidSafeLifespan(
            client1.address,
            supertokenUSDCx,
            flowRateUSDCx
          )
        ).toNumber();
        var timeArgs = encodeTimeArgs(startTime + safeLifespan, safeLifespan);
        var moduleData = {
          modules: [1, 3],
          args: [timeArgs],
        };

        await time.increase(safeLifespan); // ff time

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(1);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(taskIds.at(0));
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(now1);
        expect(flowRateOutput).to.be.equal(flowRateUSDCx);
        expect(deposit).to.be.gt(flowRateUSDCx.mul(60 * 60));
        expect(owedDeposit).to.be.equal(0);

        await ctGelatoAutoBot
          .connect(gelatoExecutor)
          .exec(
            amMain,
            amMain,
            execData,
            moduleData,
            GELATO_FEE,
            amGelatoFee,
            true,
            true
          );
        const tsDecreaseFlow = await time.latest();

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(0);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(tsDecreaseFlow);
        expect(taskId).to.not.be.equal(ethers.constants.HashZero);
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(0);
        expect(flowRateOutput).to.be.equal(0);
        expect(deposit).to.be.equal(0);
        expect(owedDeposit).to.be.equal(0);
      });
      it("Should auto decrease flow if lifespan reached - update flow if have other viewer", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          client2,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        const ctFlowClient2 = await ethers.getContractAt(
          "Flow",
          amMain,
          client2
        );
        const ctUSDCxClient2 = await ethers.getContractAt(
          ABI_SUPERTOKEN,
          networkConfig[chainId]["addrUSDCx"],
          client2
        );

        var tx = (await ctUSDCxClient2.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient2.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var lifespan = 250;
        var tx = await ctFlowClient2.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now2 = await time.latest();
        var rc = await ethers.provider.getTransactionReceipt(
          rcpt.transactionHash
        );
        var block = await ethers.provider.getBlock(rc.blockNumber);
        var startTime = block.timestamp;

        var execData = ctFlowClient2.interface.encodeFunctionData(
          "decreaseFlow",
          [supertokenUSDCx, client2.address, worker1.address, 0, flowRateUSDCx]
        );
        var timeArgs = encodeTimeArgs(startTime + lifespan, lifespan);
        var moduleData = {
          modules: [1, 3],
          args: [timeArgs],
        };

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(2);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(taskIds.at(0));
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client2.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now2);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(taskIds.at(1));
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(now2);
        expect(flowRateOutput).to.be.equal(flowRateUSDCx.mul(2));
        expect(deposit).to.be.gt(flowRateUSDCx.mul(2).mul(60 * 60));
        expect(owedDeposit).to.be.equal(0);

        await time.increase(260); // ff time

        await ctGelatoAutoBot
          .connect(gelatoExecutor)
          .exec(
            amMain,
            amMain,
            execData,
            moduleData,
            GELATO_FEE,
            amGelatoFee,
            true,
            true
          );
        const tsDecreaseFlow = await time.latest();

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(1);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(taskIds.at(0));
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client2.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now2);
        expect(tsDecrease).to.be.equal(tsDecreaseFlow);
        expect(taskId).to.not.be.equal(ethers.constants.HashZero);
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(tsDecreaseFlow);
        expect(flowRateOutput).to.be.equal(flowRateUSDCx);
        expect(deposit).to.be.gt(flowRateUSDCx.mul(60 * 60));
        expect(owedDeposit).to.be.equal(0);
      });
      it("Should fail to decrease flow if session ended by broadcaster", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;
        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );
        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();
        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();
        var rc = await ethers.provider.getTransactionReceipt(
          rcpt.transactionHash
        );
        var block = await ethers.provider.getBlock(rc.blockNumber);
        var startTime = block.timestamp;

        var execData = ctFlowClient1.interface.encodeFunctionData(
          "decreaseFlow",
          [supertokenUSDCx, client1.address, worker1.address, 0, flowRateUSDCx]
        );
        var timeArgs = encodeTimeArgs(startTime + lifespan, lifespan);
        var moduleData = {
          modules: [1, 3],
          args: [timeArgs],
        };

        await time.increase(49); // ff time

        var tx = await ctSessionWorker1.stopSessions([supertokenUSDCx]);
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        await time.increase(9); // ff time

        await expect(
          ctGelatoAutoBot
            .connect(gelatoExecutor)
            .exec(
              amMain,
              amMain,
              execData,
              moduleData,
              GELATO_FEE,
              amGelatoFee,
              true,
              true
            )
        ).to.be.reverted;
      });
    });
    describe("closeFlow", async () => {
      it("Should revert if lifespan less than minimum lifespan", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        // await time.increase(minLifespan.sub(1).toNumber());

        await expect(
          ctFlowClient1.closeFlow(supertokenUSDCx, 0)
        ).to.be.revertedWithCustomError(ctFlowClient1, "TooEarly");
      });
      it("Should revert if session already ended (make sure states not updated as well)", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        await time.increase(minLifespan.sub(1).toNumber());

        var tx = await ctSessionWorker1.stopSessions([supertokenUSDCx]);
        var rcpt = await tx.wait();

        await expect(ctFlowClient1.closeFlow(supertokenUSDCx, 0)).to.be
          .reverted; // reverted because SF flow already closed (reverts on decreaseFlow's deleteFlow)
      });
      it("Should ... check if any more revert conditions ... ?");
      it("Should cancel task, close flow and update states", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();
        var rc = await ethers.provider.getTransactionReceipt(
          rcpt.transactionHash
        );
        var block = await ethers.provider.getBlock(rc.blockNumber);
        var startTime = block.timestamp;

        var execData = ctFlowClient1.interface.encodeFunctionData(
          "decreaseFlow",
          [supertokenUSDCx, client1.address, worker1.address, 0, flowRateUSDCx]
        );
        var timeArgs = encodeTimeArgs(startTime + lifespan, lifespan);
        var moduleData = {
          modules: [1, 3],
          args: [timeArgs],
        };

        await time.increase(minLifespan.sub(1).toNumber());

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(1);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(0);
        expect(taskId).to.be.equal(taskIds.at(0));
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(now1);
        expect(flowRateOutput).to.be.equal(flowRateUSDCx);
        expect(deposit).to.be.gt(flowRateUSDCx.mul(60 * 60));
        expect(owedDeposit).to.be.equal(0);

        var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(0);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(now2);
        expect(taskId).to.not.be.equal(ethers.constants.HashZero);
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(0);
        expect(flowRateOutput).to.be.equal(0);
        expect(deposit).to.be.equal(0);
        expect(owedDeposit).to.be.equal(0);
      });
      it("Should close flows from different viewer to single broadcaster", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          client2,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        const ctFlowClient2 = await ethers.getContractAt(
          "Flow",
          amMain,
          client2
        );
        const ctUSDCxClient2 = await ethers.getContractAt(
          ABI_SUPERTOKEN,
          networkConfig[chainId]["addrUSDCx"],
          client2
        );

        var tx = (await ctUSDCxClient2.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient2.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var lifespan = 250;
        var tx = await ctFlowClient2.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(2);

        await time.increase(minLifespan.sub(1).toNumber());

        var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        var rcpt = await tx.wait();
        const now3 = await time.latest();

        var tx = await ctFlowClient2.closeFlow(supertokenUSDCx, 0);
        var rcpt = await tx.wait();
        const now4 = await time.latest();

        var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        expect(taskIds.length).to.be.equal(0);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now1);
        expect(tsDecrease).to.be.equal(now3);
        expect(taskId).to.not.be.equal(ethers.constants.HashZero);
        var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
          await ctFlowClient1.getFlowData(client2.address, supertokenUSDCx, 0);
        expect(receiver).to.be.equal(worker1.address);
        expect(sesNonce).to.be.equal(0);
        expect(tsIncrease).to.be.equal(now2);
        expect(tsDecrease).to.be.equal(now4);
        expect(taskId).to.not.be.equal(ethers.constants.HashZero);
        var {
          timestamp,
          flowRate: flowRateOutput,
          deposit,
          owedDeposit,
        } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        expect(timestamp).to.be.equal(0);
        expect(flowRateOutput).to.be.equal(0);
        expect(deposit).to.be.equal(0);
        expect(owedDeposit).to.be.equal(0);
      });
    });
    describe("getDepositUser/getDepositTotal", async () => {
      it("Should return deposit accordingly", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          client2,
          worker1,
        } = result;

        const ctFlowClient2 = await ethers.getContractAt(
          "Flow",
          amMain,
          client2
        );
        const ctUSDCxClient2 = await ethers.getContractAt(
          ABI_SUPERTOKEN,
          networkConfig[chainId]["addrUSDCx"],
          client2
        );

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        expect(
          await ctFlowClient1.getDepositUser(client2.address, supertokenUSDCx)
        ).to.be.equal(0);
        expect(
          await ctFlowClient1.getDepositTotal(supertokenUSDCx)
        ).to.be.equal(0);

        const amount1 = ethers.utils.parseEther("50");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount1
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount1
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const amount2 = ethers.utils.parseEther("30");
        var tx = (await ctUSDCxClient2.approve(
          amMain,
          amount2
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient2.depositSuperToken(
          supertokenUSDCx,
          amount2
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount1);
        expect(
          await ctFlowClient1.getDepositUser(client2.address, supertokenUSDCx)
        ).to.be.equal(amount2);
        expect(
          await ctFlowClient1.getDepositTotal(supertokenUSDCx)
        ).to.be.equal(amount1.add(amount2));

        expect(
          await ctFlowClient1.getDepositTotal(supertokenUSDCx)
        ).to.be.equal(await ctUSDCxClient1.balanceOf(amMain));
      });
    });
    describe("isViewSessionAllowed", async () => {
      it("Should be false if session not live", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(false);
      });
      it("Should be false if session live but flow not opened", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(false);
      });
      it("Should be true if session live and flow opened", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(true);
      });
      it("Should be false if things ended from session side", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(true);

        var tx = await ctSessionWorker1.stopSessions([supertokenUSDCx]);
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(false);
      });
      it("Should be false if things ended from flow side", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(true);

        await time.increase(minLifespan);

        var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(false);
      });
      it("Should be false if things ended from session side and new session started (no additional flow action)", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(true);

        // await time.increase(minLifespan);

        var tx = await ctSessionWorker1.stopSessions([supertokenUSDCx]);
        var rcpt = await tx.wait();
        // var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        // var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(false);

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(false);
      });
      it("Should be true if things ended from session side and new session + flow started", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(true);

        // await time.increase(minLifespan);

        var tx = await ctSessionWorker1.stopSessions([supertokenUSDCx]);
        var rcpt = await tx.wait();
        // var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        // var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(false);

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(true);
      });
      it("Should be true if things ended from flow side first then session side and new session + flow started", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(true);

        await time.increase(minLifespan);

        var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        var rcpt = await tx.wait();

        var tx = await ctSessionWorker1.stopSessions([supertokenUSDCx]);
        var rcpt = await tx.wait();
        // var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        // var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(false);

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(true);
      });
      it("1session - Should be false if session live but flow not opened", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSession(
          supertokenUSDCx,
          flowRateUSDCx,
          0
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(false);
      });
      it("1session - Should be true if session live and flow opened", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSession(
          supertokenUSDCx,
          flowRateUSDCx,
          0
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(true);
      });
      it("1session - Should be false if things ended from session side", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSession(
          supertokenUSDCx,
          flowRateUSDCx,
          0
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(true);

        var tx = await ctSessionWorker1.stopSession(supertokenUSDCx);
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(false);
      });
      it("1session - Should be false if things ended from flow side", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSession(
          supertokenUSDCx,
          flowRateUSDCx,
          0
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(true);

        await time.increase(minLifespan);

        var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(false);
      });
      it("1session - Should be false if things ended from session side and new session started (no additional flow action)", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSession(
          supertokenUSDCx,
          flowRateUSDCx,
          0
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(true);

        // await time.increase(minLifespan);

        var tx = await ctSessionWorker1.stopSession(supertokenUSDCx);
        var rcpt = await tx.wait();
        // var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        // var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(false);

        var tx = await ctSessionWorker1.startSession(
          supertokenUSDCx,
          flowRateUSDCx,
          0
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(false);
      });
      it("1session - Should be true if things ended from session side and new session + flow started", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSession(
          supertokenUSDCx,
          flowRateUSDCx,
          0
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(true);

        // await time.increase(minLifespan);

        var tx = await ctSessionWorker1.stopSession(supertokenUSDCx);
        var rcpt = await tx.wait();
        // var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        // var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(false);

        var tx = await ctSessionWorker1.startSession(
          supertokenUSDCx,
          flowRateUSDCx,
          0
        );
        var rcpt = await tx.wait();

        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(true);
      });
      it("1session - Should be true if things ended from flow side first then session side and new session + flow started", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSession(
          supertokenUSDCx,
          flowRateUSDCx,
          0
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(true);

        await time.increase(minLifespan);

        var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        var rcpt = await tx.wait();

        var tx = await ctSessionWorker1.stopSession(supertokenUSDCx);
        var rcpt = await tx.wait();
        // var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        // var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(false);

        var tx = await ctSessionWorker1.startSession(
          supertokenUSDCx,
          flowRateUSDCx,
          0
        );
        var rcpt = await tx.wait();

        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.isViewSessionAllowed(
            client1.address,
            worker1.address
          )
        ).to.be.equal(true);
      });
    });
    describe("withdrawSuperTokens", async () => {
      //   it("Should revert array length not match", async () => {
      //     const result = await loadFixture(init);
      //     if (!result) {
      //       expect(true).to.be.equal(false);
      //       return;
      //     }
      //     const {
      //       chainId,
      //       ctUSDCxClient1,
      //       ctCFAV1,
      //       ctControlDeployer,
      //       ctSessionClient1,
      //       ctFlowClient1,
      //       ctGelatoAutoBot,
      //       amMain,
      //       client1,
      //       worker1,
      //     } = result;

      //     const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
      //     const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
      //     const flowRateUSDCx = ethers.utils.parseEther("0.0001");
      //     const flowRateDAIx = ethers.utils.parseEther("0.0002");

      //     const amount = ethers.utils.parseEther("2");
      //     await expect(
      //       ctFlowClient1.withdrawSuperTokens(
      //         [supertokenUSDCx, supertokenDAIx],
      //         [amount]
      //       )
      //     ).to.be.revertedWithCustomError(ctFlowClient1, "ArrayLengthNotMatch");
      //   });
      it("Should revert if flow still active", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        const amt = ethers.utils.parseEther("1");
        await expect(
          ctFlowClient1.withdrawSuperToken(supertokenUSDCx, amt)
        ).to.be.revertedWithCustomError(ctFlowClient1, "HasActiveFlow");
      });
      it("Should revert if insufficient assets", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.0001");
        const flowRateDAIx = ethers.utils.parseEther("0.0002");

        const amount = ethers.utils.parseEther("2");
        await expect(
          ctFlowClient1.withdrawSuperToken(supertokenUSDCx, amount)
        ).to.be.revertedWithCustomError(ctFlowClient1, "InsufficientFunds");
      });
      it("Should withdraw full amount if no flow started", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        const bal1 = await ctUSDCxClient1.balanceOf(client1.address);

        var tx = (await ctFlowClient1.withdrawSuperToken(
          supertokenUSDCx,
          amount
        )) as any;
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        const bal2 = await ctUSDCxClient1.balanceOf(client1.address);
        expect(bal2).to.be.equal(bal1.add(amount));
      });
      it("Should revert withdraw if active flow", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);

        await expect(
          ctFlowClient1.withdrawSuperToken(supertokenUSDCx, amount)
        ).to.be.revertedWithCustomError(ctFlowClient1, "HasActiveFlow");

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
      });
      it("Should withdraw lesser amount after flow end - session stop", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);

        var fft = minLifespan.sub(1).toNumber();
        await time.increase(fft);

        var tx = await ctSessionWorker1.stopSession(supertokenUSDCx);
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(flowRateUSDCx.mul(now2 - now1));
        const bal1 = await ctUSDCxClient1.balanceOf(client1.address);

        var tx = (await ctFlowClient1.withdrawSuperToken(
          supertokenUSDCx,
          amount.sub(flowRateUSDCx.mul(now2 - now1))
        )) as any;
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        const bal2 = await ctUSDCxClient1.balanceOf(client1.address);
        expect(bal2).to.be.equal(
          bal1.add(amount.sub(flowRateUSDCx.mul(now2 - now1)))
        );
      });
      it("Should withdraw lesser amount after flow end - close flow", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);

        var fft = minLifespan.sub(1).toNumber();
        await time.increase(fft);

        var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(flowRateUSDCx.mul(now2 - now1));
        const bal1 = await ctUSDCxClient1.balanceOf(client1.address);

        var tx = (await ctFlowClient1.withdrawSuperToken(
          supertokenUSDCx,
          amount.sub(flowRateUSDCx.mul(now2 - now1))
        )) as any;
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        const bal2 = await ctUSDCxClient1.balanceOf(client1.address);
        expect(bal2).to.be.equal(
          bal1.add(amount.sub(flowRateUSDCx.mul(now2 - now1)))
        );
      });
      it("Should withdraw lesser amount after flow end - auto decrease flow", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();
        var rc = await ethers.provider.getTransactionReceipt(
          rcpt.transactionHash
        );
        var block = await ethers.provider.getBlock(rc.blockNumber);
        var startTime = block.timestamp;

        var execData = ctFlowClient1.interface.encodeFunctionData(
          "decreaseFlow",
          [supertokenUSDCx, client1.address, worker1.address, 0, flowRateUSDCx]
        );
        var timeArgs = encodeTimeArgs(startTime + lifespan, lifespan);
        var moduleData = {
          modules: [1, 3],
          args: [timeArgs],
        };

        await time.increase(lifespan); // ff time

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);

        var fft = minLifespan.sub(1).toNumber();
        await time.increase(fft);

        await ctGelatoAutoBot
          .connect(gelatoExecutor)
          .exec(
            amMain,
            amMain,
            execData,
            moduleData,
            GELATO_FEE,
            amGelatoFee,
            true,
            true
          );
        const now2 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(flowRateUSDCx.mul(now2 - now1));
        const bal1 = await ctUSDCxClient1.balanceOf(client1.address);

        var tx = (await ctFlowClient1.withdrawSuperToken(
          supertokenUSDCx,
          amount.sub(flowRateUSDCx.mul(now2 - now1))
        )) as any;
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        const bal2 = await ctUSDCxClient1.balanceOf(client1.address);
        expect(bal2).to.be.equal(
          bal1.add(amount.sub(flowRateUSDCx.mul(now2 - now1)))
        );
      });
      it("Should withdraw lesser amount after flow end - session stop - skipped multiple withdraw", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);

        var fft = minLifespan.sub(1).toNumber();
        await time.increase(fft);

        var tx = await ctSessionWorker1.stopSession(supertokenUSDCx);
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(flowRateUSDCx.mul(now2 - now1));

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now3 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount.sub(flowRateUSDCx.mul(now2 - now1)));
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);

        var tx = await ctSessionWorker1.stopSession(supertokenUSDCx);
        var rcpt = await tx.wait();
        const now4 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount.sub(flowRateUSDCx.mul(now2 - now1)));
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(flowRateUSDCx.mul(now4 - now3));
        const bal1 = await ctUSDCxClient1.balanceOf(client1.address);

        var tx = (await ctFlowClient1.withdrawSuperToken(
          supertokenUSDCx,
          amount.sub(
            flowRateUSDCx.mul(now2 - now1).add(flowRateUSDCx.mul(now4 - now3))
          )
        )) as any;
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        const bal2 = await ctUSDCxClient1.balanceOf(client1.address);
        expect(bal2).to.be.equal(
          bal1.add(
            amount.sub(
              flowRateUSDCx.mul(now2 - now1).add(flowRateUSDCx.mul(now4 - now3))
            )
          )
        );
      });
      it("Should withdraw lesser amount after flow end - close flow - skipped multiple withdraw", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);

        var fft = minLifespan.sub(1).toNumber();
        await time.increase(fft);

        var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(flowRateUSDCx.mul(now2 - now1));

        // var tx = await ctSessionWorker1.startSessions(
        //   [supertokenUSDCx],
        //   [flowRateUSDCx],
        //   [0]
        // );
        // var rcpt = await tx.wait();

        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now3 = await time.latest();

        await time.increase(fft);

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount.sub(flowRateUSDCx.mul(now2 - now1)));
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);

        var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 1);
        var rcpt = await tx.wait();
        const now4 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount.sub(flowRateUSDCx.mul(now2 - now1)));
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(flowRateUSDCx.mul(now4 - now3));
        const bal1 = await ctUSDCxClient1.balanceOf(client1.address);

        var tx = (await ctFlowClient1.withdrawSuperToken(
          supertokenUSDCx,
          amount.sub(
            flowRateUSDCx.mul(now2 - now1).add(flowRateUSDCx.mul(now4 - now3))
          )
        )) as any;
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        const bal2 = await ctUSDCxClient1.balanceOf(client1.address);
        expect(bal2).to.be.equal(
          bal1.add(
            amount.sub(
              flowRateUSDCx.mul(now2 - now1).add(flowRateUSDCx.mul(now4 - now3))
            )
          )
        );
      });
      it("Should withdraw lesser amount after flow end - decrease flow - skipped multiple withdraw", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();
        var rc = await ethers.provider.getTransactionReceipt(
          rcpt.transactionHash
        );
        var block = await ethers.provider.getBlock(rc.blockNumber);
        var startTime = block.timestamp;

        var execData = ctFlowClient1.interface.encodeFunctionData(
          "decreaseFlow",
          [supertokenUSDCx, client1.address, worker1.address, 0, flowRateUSDCx]
        );
        var timeArgs = encodeTimeArgs(startTime + lifespan, lifespan);
        var moduleData = {
          modules: [1, 3],
          args: [timeArgs],
        };

        await time.increase(lifespan); // ff time

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);

        var fft = minLifespan.sub(1).toNumber();
        await time.increase(fft);

        await ctGelatoAutoBot
          .connect(gelatoExecutor)
          .exec(
            amMain,
            amMain,
            execData,
            moduleData,
            GELATO_FEE,
            amGelatoFee,
            true,
            true
          );
        const now2 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(flowRateUSDCx.mul(now2 - now1));

        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now3 = await time.latest();
        var rc = await ethers.provider.getTransactionReceipt(
          rcpt.transactionHash
        );
        var block = await ethers.provider.getBlock(rc.blockNumber);
        var startTime = block.timestamp;

        var execData = ctFlowClient1.interface.encodeFunctionData(
          "decreaseFlow",
          [supertokenUSDCx, client1.address, worker1.address, 1, flowRateUSDCx]
        );
        var timeArgs = encodeTimeArgs(startTime + lifespan, lifespan);
        var moduleData = {
          modules: [1, 3],
          args: [timeArgs],
        };

        await time.increase(lifespan); // ff time

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount.sub(flowRateUSDCx.mul(now2 - now1)));
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);

        await ctGelatoAutoBot
          .connect(gelatoExecutor)
          .exec(
            amMain,
            amMain,
            execData,
            moduleData,
            GELATO_FEE,
            amGelatoFee,
            true,
            true
          );
        const now4 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount.sub(flowRateUSDCx.mul(now2 - now1)));
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(flowRateUSDCx.mul(now4 - now3));
        const bal1 = await ctUSDCxClient1.balanceOf(client1.address);

        var tx = (await ctFlowClient1.withdrawSuperToken(
          supertokenUSDCx,
          amount.sub(
            flowRateUSDCx.mul(now2 - now1).add(flowRateUSDCx.mul(now4 - now3))
          )
        )) as any;
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        const bal2 = await ctUSDCxClient1.balanceOf(client1.address);
        expect(bal2).to.be.equal(
          bal1.add(
            amount.sub(
              flowRateUSDCx.mul(now2 - now1).add(flowRateUSDCx.mul(now4 - now3))
            )
          )
        );
      });
      it("Should not withdraw more than allow if withdraw multiple times in a row, accumulating to full amount withdrawed - revert on additional withdrawal", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);

        var fft = minLifespan.sub(1).toNumber();
        await time.increase(fft);

        var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(flowRateUSDCx.mul(now2 - now1));
        const bal1 = await ctUSDCxClient1.balanceOf(client1.address);

        const totalWithdrawable = amount.sub(flowRateUSDCx.mul(now2 - now1));
        const part1 = totalWithdrawable.div(2);
        const part2 = totalWithdrawable.sub(part1);

        var tx = (await ctFlowClient1.withdrawSuperToken(
          supertokenUSDCx,
          part1
        )) as any;
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(part2);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        const bal2 = await ctUSDCxClient1.balanceOf(client1.address);
        expect(bal2).to.be.equal(bal1.add(part1));

        await expect(
          ctFlowClient1.withdrawSuperToken(supertokenUSDCx, totalWithdrawable)
        ).to.be.revertedWithCustomError(ctFlowClient1, "InsufficientFunds");

        var tx = (await ctFlowClient1.withdrawSuperToken(
          supertokenUSDCx,
          part2
        )) as any;
        var rcpt = await tx.wait();
        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        const bal3 = await ctUSDCxClient1.balanceOf(client1.address);
        expect(bal3).to.be.equal(bal1.add(totalWithdrawable));
      });
      it("Should withdraw correct amount even after new deposits - during flow", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);

        var fft = minLifespan.sub(1).toNumber();
        await time.increase(fft);

        var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        var rcpt = await tx.wait();
        const now2 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(flowRateUSDCx.mul(now2 - now1));

        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now3 = await time.latest();

        await time.increase(fft);

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount.sub(flowRateUSDCx.mul(now2 - now1)));
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);

        // deposit
        const amount_ = ethers.utils.parseEther("350");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount_
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount_
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 1);
        var rcpt = await tx.wait();
        const now4 = await time.latest();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(amount.sub(flowRateUSDCx.mul(now2 - now1)).add(amount_));
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(flowRateUSDCx.mul(now4 - now3));
        const bal1 = await ctUSDCxClient1.balanceOf(client1.address);

        var tx = (await ctFlowClient1.withdrawSuperToken(
          supertokenUSDCx,
          amount
            .sub(
              flowRateUSDCx.mul(now2 - now1).add(flowRateUSDCx.mul(now4 - now3))
            )
            .add(amount_)
        )) as any;
        var rcpt = await tx.wait();

        expect(
          await ctFlowClient1.getDepositUser(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        expect(
          await ctFlowClient1.getAmountFlowed(client1.address, supertokenUSDCx)
        ).to.be.equal(0);
        const bal2 = await ctUSDCxClient1.balanceOf(client1.address);
        expect(bal2).to.be.equal(
          bal1.add(
            amount
              .sub(
                flowRateUSDCx
                  .mul(now2 - now1)
                  .add(flowRateUSDCx.mul(now4 - now3))
              )
              .add(amount_)
          )
        );
      });
    });
    describe("single address can simultaneously open flow and start session", async () => {
      it("Should work as expected from beginning to end - start session before open flow", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();
        // var rc = await ethers.provider.getTransactionReceipt(
        //   rcpt.transactionHash
        // );
        // var block = await ethers.provider.getBlock(rc.blockNumber);
        // var startTime = block.timestamp;

        // var execData = ctFlowClient1.interface.encodeFunctionData(
        //   "decreaseFlow",
        //   [supertokenUSDCx, client1.address, worker1.address, 0, flowRateUSDCx]
        // );
        // var timeArgs = encodeTimeArgs(startTime + lifespan, lifespan);
        // var moduleData = {
        //   modules: [1, 3],
        //   args: [timeArgs],
        // };

        // await time.increase(minLifespan.sub(1).toNumber());

        // var taskIds = await ctGelatoAutoBot.getTaskIdsByUser(amMain);
        // expect(taskIds.length).to.be.equal(1);
        // var [receiver, sesNonce, tsIncrease, tsDecrease, taskId] =
        //   await ctFlowClient1.getFlowData(client1.address, supertokenUSDCx, 0);
        // expect(receiver).to.be.equal(worker1.address);
        // expect(sesNonce).to.be.equal(0);
        // expect(tsIncrease).to.be.equal(now1);
        // expect(tsDecrease).to.be.equal(0);
        // expect(taskId).to.be.equal(taskIds.at(0));
        // var {
        //   timestamp,
        //   flowRate: flowRateOutput,
        //   deposit,
        //   owedDeposit,
        // } = await ctCFAV1.getFlow(supertokenUSDCx, amMain, worker1.address);
        // expect(timestamp).to.be.equal(now1);
        // expect(flowRateOutput).to.be.equal(flowRateUSDCx);
        // expect(deposit).to.be.gt(flowRateUSDCx.mul(60 * 60));
        // expect(owedDeposit).to.be.equal(0);

        // var tx = await ctFlowClient1.closeFlow(supertokenUSDCx, 0);
        // var rcpt = await tx.wait();
        // const now2 = await time.latest();
      });
      it("Should work as expected from beginning to end - open flow before start session", async () => {
        const result = await loadFixture(init);
        if (!result) {
          expect(true).to.be.equal(false);
          return;
        }
        const {
          chainId,
          ctUSDCxClient1,
          ctCFAV1,
          ctControlDeployer,
          ctSessionClient1,
          ctFlowClient1,
          ctGelatoAutoBot,
          amMain,
          gelatoExecutor,
          client1,
          worker1,
        } = result;

        const supertokenUSDCx = networkConfig[chainId]["addrUSDCx"];
        const supertokenDAIx = networkConfig[chainId]["addrDAIx"];
        const flowRateUSDCx = ethers.utils.parseEther("0.01");
        const flowRateDAIx = ethers.utils.parseEther("0.02");

        await fundAppGelatoTresury(
          chainId,
          amMain,
          ethers.utils.parseEther("2")
        );

        const amountInvest = ethers.utils.parseEther("100");
        await investToApp(chainId, amMain, client1, amountInvest);

        const ctSessionWorker1 = await ethers.getContractAt(
          "Session",
          amMain,
          worker1
        );

        var tx = await ctSessionWorker1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();

        const minBalance = await ctControlDeployer.getMinimumEndDuration();
        const minLifespan = await ctControlDeployer.getMinimumLifespan();
        const amount = ethers.utils.parseEther("600");
        var tx = (await ctUSDCxClient1.approve(
          amMain,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        var tx = (await ctFlowClient1.depositSuperToken(
          supertokenUSDCx,
          amount
        )) as ContractTransaction;
        var rcpt = await tx.wait();

        const lifespan = 260;
        var tx = await ctFlowClient1.openFlow(
          worker1.address,
          supertokenUSDCx,
          lifespan
        );
        var rcpt = await tx.wait();
        const now1 = await time.latest();

        var tx = await ctSessionClient1.startSessions(
          [supertokenUSDCx],
          [flowRateUSDCx],
          [0]
        );
        var rcpt = await tx.wait();
      });
      it("TODO: expand test on this");
    });
    describe("wild - many-to-many flow to session with manual & auto flow close", async () => {
      it("Should run");
      // set BPS 720 & 1080 (and do test for "app earn portion")
      // bc1 opens ses1
      // bc2 opens ses2
      // v1 --> ses1 --> auto close
      // v1 --> ses2 --> manu close
      // v2 --> ses1 --> manu close
      // v2 --> ses2 --> auto close
      // view getEffectiveBalance from time to time !!
      // withdraw check
    });
  });
});

// REPORT_GAS=true npx hardhat test ./test/Main.ts
