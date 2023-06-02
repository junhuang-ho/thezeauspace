import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { z } from "zod";
import { type Address } from "wagmi";
import { ethers } from "ethers";

import {
  Rates,
  type RatesType,
  CHARACTERS,
  TRUNCATE_REGEX,
  REGEX_USERNAME_1,
  REGEX_USERNAME_2,
  REGEX_USERNAME_3,
  BUCKET_IMAGE_1,
  BUCKET_IMAGE_1_DEV,
  GCP_IMAGE_BASE_PATH_PUBLIC,
} from "~/constants/common";

// export const stringToColour = (str: string) => {
//   let hash = 0;
//   for (let i = 0; i < str.length; i++) {
//     hash = str.charCodeAt(i) + ((hash << 5) - hash);
//   }
//   let colour = "#";
//   for (let i = 0; i < 3; i++) {
//     let value = (hash >> (i * 8)) & 0xff;
//     value = Math.floor(value / 1.3); // make darker colours only
//     colour += ("00" + value.toString(16)).slice(-2);
//   }
//   return colour;
// }; // ref: https://stackoverflow.com/a/16348977

export const selectColor = (number: number) => {
  const hue = number * 137.508; // use golden angle approximation
  return `hsl(${hue},50%,75%)`;
}; // https://stackoverflow.com/questions/10014271/generate-random-color-distinguishable-to-humans

export const stringNumber = (string: string) => {
  if (string.length <= 0) return 1;

  let number = string.length;
  for (let i = 0; i < string.length; i++) {
    const char = (string[i] as string).toLowerCase();
    if (CHARACTERS.includes(char)) {
      const position = CHARACTERS.indexOf(char) + 1; // so don't multiply by 0

      number *= position;
    } else {
      number *= string.length;
    }
  }
  return number;
};

export const isNumeric = (val: any) =>
  (typeof val === "number" || (typeof val === "string" && val.trim() !== "")) &&
  !isNaN(val as number); // https://stackoverflow.com/a/58550111

export const restrictFormatStringEtherWithCallback = (
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  callback: (v: string) => void
) => {
  const value = event.target.value;

  if (value.includes(".")) {
    const valueDecimal = value.split(".").at(-1) as string;
    if (valueDecimal.length > 18) return false; // standard ERC20 tokens have max 18 decimals
  }

  if (isNumeric(value) || value.length === 0) {
    // return value.trim();
    callback(value.trim());
  }
};

export const restrictFormatStringEtherWithSetter = (
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  setValue: Dispatch<SetStateAction<string>>
) => {
  const value = event.target.value;

  if (value.includes(".")) {
    const valueDecimal = value.split(".").at(-1) as string;
    if (valueDecimal.length > 18) return false; // standard ERC20 tokens have max 18 decimals
  }

  if (isNumeric(value) || value.length === 0) setValue(value.trim());
};

export const restrictFormatNumber = (
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  setValue: Dispatch<SetStateAction<string>>
) => {
  const value = event.target.value;

  const regex = /^[0-9\b]+$/;
  if (value === "" || regex.test(value)) setValue(value);
};

export const secondsToDHMS = (seconds: number) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const dDisplay = d > 0 ? d.toString() + (d == 1 ? " day, " : " days, ") : "";
  const hDisplay =
    h > 0 ? h.toString() + (h == 1 ? " hour, " : " hours, ") : "";
  const mDisplay =
    m > 0 ? m.toString() + (m == 1 ? " minute, " : " minutes, ") : "";
  const sDisplay =
    s > 0 ? s.toString() + (s == 1 ? " second" : " seconds") : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
};

export const truncateEthAddress = (address: Address) => {
  const match = address.match(TRUNCATE_REGEX);
  if (!match) return address;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return `${match[1]}…${match[2]}`;
};

export const getFlowRateInSeconds = (
  incomingRate?: RatesType,
  flowRate?: string
) => {
  if (flowRate === undefined) return ethers.BigNumber.from(0);
  if (incomingRate === Rates.enum.Second)
    return ethers.utils.parseEther(flowRate);
  if (incomingRate === Rates.enum.Minute)
    return ethers.utils.parseEther(flowRate).div(60);
  if (incomingRate === Rates.enum.Hour)
    return ethers.utils.parseEther(flowRate).div(60).div(60);

  return ethers.BigNumber.from(0);
};

const regex2 = new RegExp(REGEX_USERNAME_2);
const regex3 = new RegExp(REGEX_USERNAME_3);

export const OnlyValidUsername = z
  .string()
  .regex(REGEX_USERNAME_1, {
    message:
      "Only lower case letters (a-z), numbers (0-9), full stops (.) and between 2 to 15 characters are allowed.",
  })
  .trim()
  .and(
    z.custom(
      (val) => {
        const val_ = val as string;
        const isMatch2 = regex2.test(val_);
        const isMatch3 = regex3.test(val_);

        return !isMatch2 && !isMatch3;
      },
      {
        message: "Cannot contain words such as admin and zeau are not allowed.",
      }
    )
  );

export const getGCPImageFolderName = () => {
  if (process.env.NODE_ENV === "production") {
    return BUCKET_IMAGE_1;
  } else {
    return BUCKET_IMAGE_1_DEV;
  }
};

export const getImagePath = (address?: Address) => {
  if (address === undefined) return;
  return `${GCP_IMAGE_BASE_PATH_PUBLIC}/${getGCPImageFolderName()}/${address}.jpeg`;
};

export const removeAllMIMETypes = (image: string) => {
  // ref: https://stackoverflow.com/questions/51912528/google-cloud-storage-uploaded-via-node-image-is-broken
  // ref: https://stackoverflow.com/questions/8110294/nodejs-base64-image-encoding-decoding-not-quite-working
  return Buffer.from(
    image.replace(/^data:image\/(png|gif|jpeg);base64,/, ""),
    "base64"
  );
};
