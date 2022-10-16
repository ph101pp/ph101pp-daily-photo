import getBaseMetadata, { MetadataType } from "./getBaseMetadata";

export default function getFutureMetadata(dateString: string): MetadataType {
  const baseMetadata = getBaseMetadata(dateString);
  const formattedDate = baseMetadata.name;
  return {
    ...baseMetadata,
    attributes: [
      {
        "trait_type": "Revealed",
        "value": false
      }
    ],
    "description": `This photo will be taken on ${formattedDate}.`,
    "image": "https://arweave.net/PadvL0JxAXygBESPC-ewSbMv3pDGm56z8N7KHdno5hc",
    "image_url": "https://arweave.net/PadvL0JxAXygBESPC-ewSbMv3pDGm56z8N7KHdno5hc"
  }
}
