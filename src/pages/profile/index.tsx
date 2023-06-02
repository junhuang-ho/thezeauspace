import { type NextPage } from "next";
import Head from "next/head";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { api } from "~/utils/api";

import { useState, useEffect } from "react";
import { useAuthentication } from "~/contexts/Authentication";
import { useForm, Controller } from "react-hook-form";
import useScreenSize from "~/hooks/common/useScreenSize";

import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import UploadProfilePicture from "~/components/utils/UploadProfilePicture";

import { OnlyValidUsername } from "~/utils/common";
import { MiB_IN_BYTES } from "~/constants/common";

import { useDropzone, DropzoneProps } from "react-dropzone";
import Cropper, { type Area } from "react-easy-crop";
import imageCompression from "browser-image-compression";

type ProfileFormValues = {
  username?: string;
  imageUrl?: string;
};

const Profile: NextPage = () => {
  const { isConnected } = useAuthentication();
  const { data: username } = api.profile.getOwnProfile.useQuery(undefined, {
    refetchInterval: false, // millisecond
    refetchIntervalInBackground: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    select: (data) => {
      if (data === null || data === undefined) return undefined;
      return data.username;
    },
  });
  const isUpdate = username !== undefined;

  const schema = z.object({
    username: OnlyValidUsername.optional(),
    imageUrl: z.string().optional(),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful, isDirty },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      username: isConnected ? username ?? "" : "", // TODO: use
      imageUrl: undefined,
    }, // not work to set init values from local storage, use useEffect below
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!isConnected) return;
    reset({
      username: username ?? "",
    });
  }, [isConnected, username, reset]);

  const { isWide } = useScreenSize();

  const { mutateAsync: setUsername } = api.profile.setUsername.useMutation();

  const [responseError, setResponseError] = useState<string | undefined>(
    undefined
  );
  useEffect(() => {
    setResponseError(undefined);
  }, [isDirty]);
  const isSuccess = responseError === undefined && isSubmitSuccessful;

  if (!isConnected) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ width: "100%" }}>
        <Typography>Please login to continue</Typography>
      </Stack>
    );
  }

  return (
    <Stack>
      <Head>
        <title>zeau | Studio</title>
        <meta name="description" content="Web3 Livestreaming" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Stack spacing={6}>
        <Typography variant="h4" align="center" sx={{ fontWeight: "bold" }}>
          Edit Profile
        </Typography>

        <form
          onSubmit={handleSubmit(async (data) => {
            // TODO: edit condition for imageUrl
            if (!data.username) return;

            try {
              const resp = await setUsername({
                username: data.username,
                isUpdate: isUpdate,
              });

              if (!resp.success) {
                if (resp.reason === "username already exists") {
                  setResponseError("Username already exists");
                } else {
                  setResponseError("Please try again later");
                }
              } else {
                setResponseError(undefined);
              }
            } catch (error) {
              console.error(error);
            }
          })}
          style={{ width: "100%" }}
        >
          <Stack spacing={2} sx={{ width: !isWide ? "90vw" : "30vw" }}>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Set a Username"
                  {...field}
                  error={!!errors.username || responseError !== undefined}
                  helperText={errors.username?.message || responseError}
                />
              )}
            />

            <Button
              variant="contained"
              type="submit"
              disabled={isSubmitting || !isConnected || isSuccess}
              sx={{
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              Set Username
            </Button>
            {isSuccess && (
              <Typography
                align="center"
                color="success.main"
                sx={{ fontWeight: "bold" }}
              >
                Profile updated successfully!
              </Typography>
            )}
          </Stack>
        </form>

        <UploadProfilePicture />
      </Stack>
    </Stack>
  );
};

export default Profile;
