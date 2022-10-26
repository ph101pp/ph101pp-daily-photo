import { TokenMetadataInputType } from "../components/_types/TokenMetadataInputType";
import getBaseMetadata, { MetadataType } from "./getBaseMetadata";

export default function getTokenMetadata({
  dateString,
  description,
  place,
  country,
  camera,
  settings,
  image_details,
  imageTx
}:{
  dateString: string,
  imageTx:string
} & TokenMetadataInputType): MetadataType {
  const baseMetadata = getBaseMetadata(dateString);
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
      ...baseMetadata.attributes,
    ],
    "image_details": image_details
  }
}
