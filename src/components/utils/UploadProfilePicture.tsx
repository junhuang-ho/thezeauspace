import { useState, useCallback } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

import CloudUploadOutline from "../icons/CloudUploadOutline";
import CloseCircleOutline from "../icons/CloseCircleOutline";

import Cropper, { type Area } from "react-easy-crop";
import imageCompression from "browser-image-compression";

import { useAccount } from "wagmi";
import { useDropzone } from "react-dropzone";
import { getImagePath, removeAllMIMETypes } from "~/utils/common";

import { MiB_IN_BYTES } from "~/constants/common";

import axios from "axios";
import { api } from "~/utils/api";

const createImage = (url: string) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

const getRadianAngle = (degreeValue: number) => {
  return (degreeValue * Math.PI) / 180;
};

const rotateSize = (width: number, height: number, rotation: number) => {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
) => {
  const image = (await createImage(imageSrc)) as HTMLImageElement;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0);

  // As Base64 string
  return canvas.toDataURL("image/jpeg");

  // As a blob
  //   return new Promise((resolve, reject) => {
  //     canvas.toBlob((file: any) => {
  //       resolve(URL.createObjectURL(file));
  //     }, "image/jpeg");
  //   });
};

const UploadProfilePicture = () => {
  const { address: addressWallet } = useAccount();
  const [image, setImage] = useState<string | undefined>(undefined);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [isCroppingImage, setIsCroppingImage] = useState<boolean>(false);
  const [isDropping, setIsDropping] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [isUploaded, setIsUploaded] = useState<boolean>(false);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/jpeg": [],
      "image/png": [],
    },
    disabled: isDropping,
    multiple: false,
    maxFiles: 1,
    maxSize: MiB_IN_BYTES,
    onDrop: async (acceptedFiles, fileRejections, event) => {
      setIsDropping(true);
      const file = acceptedFiles[0];

      if (file === undefined) {
        setIsDropping(false);
        return;
      }

      try {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: MiB_IN_BYTES,
        });
        const url = URL.createObjectURL(compressedFile);
        setImage(url);
      } catch (error) {
        setIsDropping(false);
        console.error(error);
      }

      setIsDropping(false);
    },
  });

  const onCropComplete = useCallback(
    async (croppedArea: Area, croppedAreaPixels: Area) => {
      if (!image) return;
      setIsCroppingImage(true);
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      setCroppedImage(croppedImage);
      setIsCroppingImage(false);
    },
    [image]
  );

  const { mutateAsync: fetchPUTURLImage } =
    api.profile.fetchPUTURLImage.useMutation();

  return (
    <Stack spacing={2} sx={{ height: 200 }}>
      {image ? (
        <Box sx={{ position: "relative", width: "100%", height: 200 }}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />

          <IconButton
            onClick={() => {
              setImage(undefined);
              setCroppedImage(null);
            }}
            sx={{ position: "absolute", top: 0, right: 0 }}
          >
            <CloseCircleOutline />
          </IconButton>
        </Box>
      ) : (
        <Stack
          alignItems="center"
          justifyContent="center"
          {...getRootProps()}
          sx={{
            p: 1,
            border: 2,
            borderStyle: "dashed",
            width: "100%",
            height: "100%",
          }}
        >
          <input {...getInputProps()} />
          {isDropping ? (
            <CircularProgress />
          ) : (
            <IconButton component="label" disabled={isDropping}>
              <Avatar
                alt=""
                src={getImagePath(addressWallet)}
                sx={{ width: 100, height: 100 }}
              >
                <CloudUploadOutline />
              </Avatar>
            </IconButton>
          )}
        </Stack>
      )}

      <Button
        variant="contained"
        disabled={isCompleting}
        onClick={async () => {
          if (croppedImage === null || isCroppingImage) return;
          setIsCompleting(true);

          const putURLImage = await fetchPUTURLImage();

          const img = removeAllMIMETypes(croppedImage);

          try {
            await axios.put(putURLImage, img, {
              headers: { "Content-Type": "image/jpeg" },
            }); // "image/jpeg"
            setIsUploaded(true);
          } catch (error) {
            alert("Error upload image");
            setImage(undefined);
            setIsCompleting(false);
          }
          setImage(undefined);
          setIsCompleting(false);
        }}
        sx={{
          textTransform: "none",
          fontWeight: "bold",
        }}
      >
        Upload
      </Button>

      {isUploaded && (
        <Typography align="center" variant="caption" color="success.main">
          Image uploaded successfully! It may take awhile for changes to take
          affect.
        </Typography>
      )}
    </Stack>
  );
};

export default UploadProfilePicture;
