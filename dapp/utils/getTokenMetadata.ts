import { TokenMetadataInputType } from "../components/_types/TokenMetadataInputType";
import getBaseMetadata, { MetadataType } from "./getBaseMetadata";

export default function getTokenMetadata({
  dateString,
  description,
  place,
  country,
  camera,
  settings,
  project,
  image_details,
  imageTx,
  tokenIndex
}:{
  dateString: string,
  imageTx:string,
  tokenIndex: string
} & TokenMetadataInputType): MetadataType {
  const baseMetadata = getBaseMetadata(dateString, tokenIndex);
  return {
    "description": `${description}`,
    "image": `https://arweave.net/${imageTx}`,
    "image_url": `https://arweave.net/${imageTx}`,
    ...baseMetadata,
    attributes: [
      {
        "trait_type": "Place",
        "value": place
      },
      {
        "trait_type": "Country",
        "value": country
      },
      {
        "trait_type": "Camera",
        "value": camera
      },
      {
        "trait_type": "Settings",
        "value": settings
      },
      {
        "trait_type": "Type",
        "value": "Photo"
      },
      {
        "trait_type": "Project",
        "value": project
      },
      ...baseMetadata.attributes,
    ],
    "image_details": image_details
  }
}
