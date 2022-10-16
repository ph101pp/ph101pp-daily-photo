import React, { useState } from "react";
import { useRecoilValue } from "recoil";
import useArweave from "./_hooks/useArweave";
import arweaveStatusAtom from "./_atoms/arweaveStatusAtom";
import imageAtom from "./_atoms/imageAtom";
import UploadImage from "./UploadImage";
import MetadataForm from "./MetadataForm";
import MetadataPreview from "./MetadataPreview";
import ExifData from "./ExifData";
import UploadAndPublish from "./UploadAndPublish";
import ArweaveProgress from "./ArweaveProgress";

export default function NewToken() {
  return (
    <>
      <UploadImage />
      <ExifData />
      <MetadataForm />
      <MetadataPreview />
      <UploadAndPublish />
    </>
  )
}
