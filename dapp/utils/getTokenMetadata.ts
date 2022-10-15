import getBaseMetadata, { Metadata } from "./getBaseMetadata";

export default function getTokenMetadata({
  dateString,
  description,
  place,
  country,
  camera,
  settings,
  imageTx
}:{
  dateString: string,
  description:string,
  place:string,
  country:string,
  camera: string,
  settings:string,
  imageTx:string
}): Metadata {
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
      ...baseMetadata.attributes,
    ],
  }
}
