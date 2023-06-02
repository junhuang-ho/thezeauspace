import Head from "next/head";
import { ethers } from "ethers";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";
import useScreenSize from "~/hooks/common/useScreenSize";
import useTokenSymbol from "~/hooks/web3/reads/utils/useTokenSymbol";
import useSAWithdrawAsToken from "~/hooks/web3/writes/useSAWithdrawAsToken";

import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import FlowDebugInfo from "~/components/developer/FlowDebugInfo";

import { restrictFormatStringEtherWithSetter } from "~/utils/common";
import { ZERO_STRING } from "~/constants/common";

const Withdraw = () => {
  const { isWide } = useScreenSize();
  const { isConnected } = useAuthentication();
  const { addressUSDC, addressUSDCx } = useAppStates();
  const { address: addressWallet } = useAccount();
  const { symbol: symbolUSDC } = useTokenSymbol(addressUSDC);

  const [isTransfer, setIsTransfer] = useState<boolean>(false);
  const [addressReceiver, setAddressReceiver] = useState<string>("");
  const isOwnAddress = addressReceiver === addressWallet;
  const isInvalidAddressReceiver =
    !ethers.utils.isAddress(addressReceiver) || isOwnAddress;
  const isShowInvalidAddressReceiver =
    addressReceiver.length > 0 && isInvalidAddressReceiver;

  const {
    totalFunds,
    // totalFundsSuperToken,
    isSufficientAmountToken,
    // isSufficientAmountSuperToken,
    isInvalidWithdrawSuperToken,
    isInvalidWithdrawTotalAmount,
    // isShowErrorWithdrawSuperToken,
    isShowErrorWithdrawTotalAmount,
    isEnabledSAWithdrawAsToken,
    isProcessingSAWithdrawAsToken,
    // addressToken,
    totalWithdrawAmount,
    setAddressToken,
    setTotalWithdrawAmount,
    fetchWithdrawAsTokenMaxBalance,
    saWithdrawAsToken,
  } = useSAWithdrawAsToken({
    addressTransfer: addressReceiver,
    onCallback: () => {
      if (isTransfer) {
        setAddressReceiver("");
        setTotalWithdrawAmount(ZERO_STRING);
      } else {
        // TODO: trigger fiat conversion
      }
    },
  });

  useEffect(() => {
    setAddressToken(addressUSDCx); // ENHANCE: make dynamic
  }, [addressUSDCx, setAddressToken]);

  const isProcessing = isProcessingSAWithdrawAsToken; // || TODO: add

  const isWeb3ProcessingAvailable =
    saWithdrawAsToken !== undefined && isEnabledSAWithdrawAsToken;
  const isButtonDisable =
    isInvalidWithdrawSuperToken ||
    isInvalidWithdrawTotalAmount ||
    isProcessing ||
    (isTransfer
      ? isInvalidAddressReceiver || !isWeb3ProcessingAvailable
      : !isSufficientAmountToken && !isWeb3ProcessingAvailable);

  if (!isConnected) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ width: "100%" }}>
        <Typography>Please login to continue</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={12} sx={{ width: !isWide ? "90vw" : "30vw" }}>
      <Head>
        <title>zeau | Withdraw</title>
        <meta name="description" content="Web3 Livestreaming" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ToggleButtonGroup
        fullWidth
        exclusive
        color="primary"
        value={isTransfer}
        onChange={() => {
          setIsTransfer((prev) => !prev);
          setAddressReceiver("");
          setTotalWithdrawAmount(ZERO_STRING);
        }}
      >
        <ToggleButton
          value={false}
          sx={{ textTransform: "none", fontWeight: "bold" }}
        >
          Withdraw to Fiat
        </ToggleButton>
        <ToggleButton
          value={true}
          sx={{ textTransform: "none", fontWeight: "bold" }}
        >
          Transfer to Wallet
        </ToggleButton>
      </ToggleButtonGroup>

      <Stack spacing={4}>
        {isTransfer && (
          <TextField
            label="Recipient Address"
            disabled={isProcessing}
            value={addressReceiver}
            onChange={(event) => setAddressReceiver(event.target.value)}
            error={isShowInvalidAddressReceiver}
            helperText={
              isShowInvalidAddressReceiver &&
              (isOwnAddress ? "Cannot be own address" : "Invalid Address")
            }
          />
        )}

        <Stack>
          <TextField
            label="Withdraw Amount"
            disabled={isProcessing}
            value={totalWithdrawAmount}
            onChange={(event) =>
              restrictFormatStringEtherWithSetter(event, setTotalWithdrawAmount)
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">{symbolUSDC}</InputAdornment>
              ),
            }}
            error={isShowErrorWithdrawTotalAmount}
            helperText={isShowErrorWithdrawTotalAmount && "Insufficient Amount"}
          />
          <Stack direction="row" alignItems="center" justifyContent="flex-end">
            <Button
              disabled={isProcessing}
              size="small"
              onClick={() => {
                setTotalWithdrawAmount(ethers.utils.formatEther(totalFunds));
              }}
              sx={{
                fontWeight: "bold",
                display: "inline",
                p: 0,
                minWidth: 40,
                height: 16,
                lineHeight: 1,
              }}
            >
              max
            </Button>
            <Typography variant="caption" sx={{ pt: 0.4 }}>
              Balance: {Number(ethers.utils.formatEther(totalFunds)).toFixed(4)}
            </Typography>
          </Stack>
        </Stack>

        <Button
          variant="contained"
          disabled={isButtonDisable}
          onClick={async () => {
            if (isTransfer) {
              await saWithdrawAsToken?.();
            } else {
              if (!isSufficientAmountToken) {
                await saWithdrawAsToken?.();
              } else {
                // TODO: convert only USDC to fiat
                setAddressReceiver(""); // TODO: move to run this AFTER converted to fiat
                setTotalWithdrawAmount(ZERO_STRING); // TODO: move to run this AFTER converted to fiat
              }
            }
          }}
          sx={{
            textTransform: "none",
            fontWeight: "bold",
          }}
        >
          {isTransfer ? "Transfer" : "Withdraw"}
        </Button>
      </Stack>

      {process.env.NODE_ENV === "development" && (
        <FlowDebugInfo isViewSessionAllowed={false} />
      )}
    </Stack>
  );
};

export default Withdraw;
// TODO: to rate limit
