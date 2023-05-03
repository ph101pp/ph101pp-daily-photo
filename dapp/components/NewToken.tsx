import React from "react";
import UploadImage from "./UploadImage";
import MetadataForm from "./MetadataForm";
import MetadataPreview from "./MetadataPreview";
import ExifData from "./ExifData";
import UploadAndPublish from "./UploadAndPublish";
import NextAuthHeader from "./NextAuthHeader";
import { useSession } from "next-auth/react";
import { useRecoilState, useRecoilValue } from "recoil";
import ExistingToken from "./ExistingToken";
import manifestAtom from "./_atoms/manifestAtom";
import { MetadataType } from "../utils/getBaseMetadata";
import { FormContainer } from "react-hook-form-mui";
import defaultTokenMetadataInputAtom from "./_atoms/defaultTokenMetadataInputAtom";

export default function NewToken({ tokenMetadata }: { tokenMetadata: MetadataType }) {
  const manifest = useRecoilValue(manifestAtom);
  const [input, setInput] = useRecoilState(defaultTokenMetadataInputAtom);

  if (!manifest || !input) {
    return <ExistingToken tokenMetadata={tokenMetadata} />
  }

  const { image_details, ...defaultInput } = input;

  return (
    <FormContainer
      defaultValues={defaultInput}
      onSuccess={data => {
        if (!input) {
          return;
        }
        setInput({
          project: data.project,
          settings: data.settings,
          camera: data.camera,
          description: data.description,
          place: data.place,
          country: data.country,
          image_details
        })
      }}
    >
      <NextAuthHeader />
      <UploadImage title={tokenMetadata.name} />
      <ExifData />
      <MetadataForm />
      <MetadataPreview />
      <UploadAndPublish />
    </FormContainer>
  )
}
