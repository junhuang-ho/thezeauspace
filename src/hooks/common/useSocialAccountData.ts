import { ZeroDevWeb3Auth } from "@zerodevapp/web3auth";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

import { env } from "~/env.mjs";

type OpenloginUserInfo = {
  aggregateVerifier: string;
  dappShare: string;
  email: string;
  idToken: string;
  name: string;
  oAuthAccessToken: string;
  oAuthIdToken: string;
  profileImage: string;
  typeOfLogin: string;
  verifier: string;
  verifierId: string;
};

const useSocialAccountData = () => {
  const { address: addressWallet } = useAccount();

  const [userData, setUserData] = useState<OpenloginUserInfo | undefined>(
    undefined
  );

  useEffect(() => {
    const getUserInfo = async () => {
      if (!addressWallet) return;

      // eslint-disable-next-line
      const zeroDevWeb3Auth = new ZeroDevWeb3Auth([
        env.NEXT_PUBLIC_ZERODEV_PROJECT_ID,
      ]);
      try {
        // eslint-disable-next-line
        const data = await zeroDevWeb3Auth.getUserInfo();
        setUserData(data as OpenloginUserInfo);
      } catch (error) {
        console.error("Error retrieving OpenLogin", error);
      }
    };
    void getUserInfo();
  }, [addressWallet]);

  return userData;
};

export default useSocialAccountData;
