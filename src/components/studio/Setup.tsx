import { z } from "zod";
import NextLink from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ethers } from "ethers";
import { stringify, parse } from "superjson";

import { api } from "~/utils/api";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useCounter, useLocalStorage } from "@mantine/hooks";
import { useAppStates } from "~/contexts/AppStates";
import { useNotifications } from "~/contexts/Notifications";
import useTokenSymbol from "~/hooks/web3/reads/utils/useTokenSymbol";
import { useStudio } from "~/pages/studio";
import useScreenSize from "~/hooks/common/useScreenSize";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import { alpha } from "@mui/material";

import {
  restrictFormatStringEtherWithCallback,
  getFlowRateInSeconds,
} from "~/utils/common";
import {
  MIN_LENGTH_TITLE,
  MAX_LENGTH_TITLE,
  Rates,
  ROUTE_PROFILE,
} from "~/constants/common";
import { type StudioFormValues } from "~/pages/studio";

const ratesObj = {
  Second: "per second",
  Minute: "per minute",
  Hour: "per hour",
} as const;

const Setup = () => {
  const defaultValue = {
    flowRate: "",
    rate: Rates.enum.Minute,
    title: "",
  };
  const [studioFormValuesLocal, setStudioFormValuesLocal] =
    useLocalStorage<StudioFormValues>({
      key: "studio-form-values-v1",
      defaultValue: defaultValue,
      serialize: stringify,
      deserialize: (str) => (str === undefined ? defaultValue : parse(str)),
    });

  const schema = z.object({
    flowRate: z.string().nonempty("Flow rate is required"),
    rate: Rates,
    title: z
      .string()
      .nonempty("Title is required")
      .min(MIN_LENGTH_TITLE)
      .max(MAX_LENGTH_TITLE),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    getValues,
    setValue,
    clearErrors,
  } = useForm<StudioFormValues>({
    defaultValues: {
      flowRate: studioFormValuesLocal.flowRate,
      rate: studioFormValuesLocal.rate,
      title: studioFormValuesLocal.title,
    }, // not work to set init values from local storage, use useEffect below
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    reset(studioFormValuesLocal);
  }, [studioFormValuesLocal, reset]);

  const {
    isEnabledSessionStart,
    setStudioFormValues,
    setSessionStartFlowRate,
    setIsPreview,
  } = useStudio();
  const { setIsPingInvalidStartSession } = useNotifications();
  const { isWide } = useScreenSize();

  const initialRateIndex = Rates.options.indexOf("Minute");
  const [count, { increment }] = useCounter(initialRateIndex + 1);
  const [rateToggled, setRateToggled] = useState<boolean>(false);

  const timer = () => setTimeout(() => setRateToggled(false), 500);
  const [rateTimeout, setRateTimeout] =
    useState<ReturnType<typeof setTimeout>>(timer);

  const handleToggleRate = () => {
    clearTimeout(rateTimeout);
    setRateTimeout(timer);
    setRateToggled((prev) => !prev);
  };

  const isRateSecond = getValues("rate") === Rates.enum.Second;
  const isRateMinute = getValues("rate") === Rates.enum.Minute;
  const isRateHour = getValues("rate") === Rates.enum.Hour;
  const flowRate = getValues("flowRate");
  const isValidFlowRate = flowRate.length > 0 && flowRate !== "0";
  const equivalentRate = isValidFlowRate
    ? (isRateSecond && flowRate) ||
      (isRateMinute &&
        ethers.utils.formatEther(
          getFlowRateInSeconds(Rates.enum.Minute, flowRate)
        )) ||
      (isRateHour &&
        ethers.utils.formatEther(
          getFlowRateInSeconds(Rates.enum.Hour, flowRate)
        )) ||
      ""
    : "";

  useEffect(() => {
    setSessionStartFlowRate(equivalentRate);
  }, [equivalentRate, setSessionStartFlowRate]); // required to set initial value from local storage to form

  const { addressUSDC } = useAppStates();
  const { symbol: symbolUSDC } = useTokenSymbol(addressUSDC);

  const { data: username } = api.profile.getOwnProfile.useQuery(undefined, {
    refetchInterval: false, // millisecond
    refetchIntervalInBackground: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    select: (data) => {
      if (data === null || data === undefined) return undefined;
      return data.username;
    },
  });
  const isUsernameRequired = username === undefined;

  return (
    <Stack>
      {isUsernameRequired ? (
        <Link
          component={NextLink}
          href={ROUTE_PROFILE}
          color="primary"
          sx={{ pt: 10 }}
        >
          Username required before going live
        </Link>
      ) : (
        <form
          onSubmit={handleSubmit((data) => {
            if (isEnabledSessionStart) {
              setStudioFormValues(data);
              setIsPreview(true);
              setStudioFormValuesLocal(data);
              console.log(data);
            } else {
              setIsPingInvalidStartSession(true);
            }
          })}
          style={{ width: "100%" }}
        >
          <Stack spacing={6} sx={{ width: !isWide ? "100%" : "30vw" }}>
            <Typography variant="h4" align="center" sx={{ fontWeight: "bold" }}>
              Livestream Setup
            </Typography>

            <Stack spacing={2}>
              <Controller
                name="flowRate"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Flow Rate"
                    {...field}
                    onChange={(event) =>
                      restrictFormatStringEtherWithCallback(event, (v) => {
                        clearErrors("flowRate");
                        setSessionStartFlowRate(v);
                        setValue("flowRate", v);
                      })
                    }
                    error={!!errors.flowRate}
                    helperText={errors.flowRate?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            variant="contained"
                            color={rateToggled ? "success" : undefined}
                            onClick={() => {
                              const rateIndex = count % Rates.options.length;
                              setValue(
                                "rate",
                                Rates.options[rateIndex] ?? Rates.enum.Minute
                              );
                              handleToggleRate();
                              increment();
                            }}
                            sx={{
                              textTransform: "none",
                              fontWeight: "bold",
                              width: 145,
                            }}
                          >
                            {symbolUSDC} {ratesObj[getValues("rate")]}
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
              <TextField
                label="Equivalent to a flow rate of"
                value={equivalentRate}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Box
                        sx={{
                          p: 1.2,
                          fontWeight: "bold",
                          fontSize: 14,
                          color:
                            isValidFlowRate && rateToggled
                              ? "success.main"
                              : undefined,
                        }}
                      >
                        {symbolUSDC} {ratesObj.Second}
                      </Box>
                    </InputAdornment>
                  ),
                }}
                sx={(theme) => ({
                  bgcolor:
                    isValidFlowRate && rateToggled
                      ? alpha(theme.palette.success.main, 0.1)
                      : undefined,
                })}
              />
            </Stack>

            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Title"
                  multiline
                  rows={5}
                  {...field}
                  error={!!errors.title}
                  helperText={errors.title?.message}
                  inputProps={{ maxLength: MAX_LENGTH_TITLE }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment
                        position="end"
                        sx={{
                          position: "absolute",
                          bottom: 15,
                          right: 10,
                        }}
                      >
                        {field.value?.length}/{MAX_LENGTH_TITLE}
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Button
              variant="contained"
              type="submit"
              sx={{
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              Next
            </Button>
          </Stack>
        </form>
      )}
    </Stack>
  );
};

export default Setup;
// TODO: set flow rate percentage take min/max flow rate
// TODO: video quality selector
