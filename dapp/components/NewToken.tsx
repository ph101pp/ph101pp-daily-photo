import React from "react";
import UploadImage from "./UploadImage";
import MetadataForm from "./MetadataForm";
import MetadataPreview from "./MetadataPreview";
import ExifData from "./ExifData";
import UploadAndPublish from "./UploadAndPublish";
import NextAuthHeader from "./NextAuthHeader";
import { useSession } from "next-auth/react";
import { useRecoilValue } from "recoil";
import ExistingToken from "./ExistingToken";
import manifestAtom from "./_atoms/manifestAtom";
import { MetadataType } from "../utils/getBaseMetadata";

export default function NewToken({ futureTokenData }: { futureTokenData: MetadataType }) {
  const manifest = useRecoilValue(manifestAtom);


  if (!manifest) {
    return <ExistingToken tokenMetadata={futureTokenData} />
  }

  return (
    <>
      <NextAuthHeader />
      <UploadImage title={futureTokenData.name} />
      <ExifData />
      <MetadataForm />
      <MetadataPreview />
      <UploadAndPublish />
    </>
  )
}
