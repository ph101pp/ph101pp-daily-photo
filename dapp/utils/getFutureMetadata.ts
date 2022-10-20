import getBaseMetadata, { MetadataType } from "./getBaseMetadata";

export default function getFutureMetadata(dateString: string): MetadataType {
  const baseMetadata = getBaseMetadata(dateString);
  const formattedDate = baseMetadata.name;
  return {
    ...baseMetadata,
    attributes: [
      {
        "trait_type": "Revealed",
        "value": "false"
      },
      ...baseMetadata.attributes
    ],
    "description": `This photo will be taken on ${formattedDate}.`,
    "image": "https://arweave.net/PadvL0JxAXygBESPC-ewSbMv3pDGm56z8N7KHdno5hc",
    "image_url": "https://arweave.net/PadvL0JxAXygBESPC-ewSbMv3pDGm56z8N7KHdno5hc",
    "image_details": {
      "size": 7767499,
      "type": "image/jpeg",
      "width": 3000,
      "height": 2000,
      "sha256": "40604204233da5a4d706e7fdc7d01da30b7bf2848b0475a635c6320b3b272955"
    }
  }
}
