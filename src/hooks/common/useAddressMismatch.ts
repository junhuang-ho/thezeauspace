import { api } from "~/utils/api";

import { useAccount } from "wagmi";
import { useEffect } from "react";

const useAddressMismatch = ({
  callback,
}: {
  callback: () => Promise<void>;
}) => {
  const { address: addressClient } = useAccount();

  const { data: addressServer } = api.test.addressTestProtected.useQuery(
    undefined,
    {
      refetchInterval: false,
      refetchIntervalInBackground: false,
    }
  );

  const isReady = addressClient !== undefined && addressServer !== undefined;
  const isMatch = addressClient === addressServer;

  useEffect(() => {
    if (!isReady) return;

    const callback_ = async () => {
      await callback();
    };

    if (!isMatch) {
      console.warn("ADDRESS MISMATCH");
      void callback_();
    } else {
      console.warn("addresss match :)");
    }
  }, [isReady, isMatch, callback]);
};

export default useAddressMismatch;
