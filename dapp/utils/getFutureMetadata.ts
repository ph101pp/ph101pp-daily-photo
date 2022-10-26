import getBaseMetadata, { MetadataType } from "./getBaseMetadata";

export default function getFutureMetadata(dateString: string): MetadataType {
  const baseMetadata = getBaseMetadata(dateString);
  const formattedDate = baseMetadata.name;
  return {
    ...baseMetadata,
    attributes: [
      {
        "trait_type": "Type",
        "value": "Future"
      },
      ...baseMetadata.attributes
    ],
    "description": `This photo will be taken on ${formattedDate}.`,
    "image": "https://arweave.net/vypLWOLtueuiFcLnrDA79wGSLwTVJstdeLxgUDUNtDg",
    "image_url": "https://arweave.net/vypLWOLtueuiFcLnrDA79wGSLwTVJstdeLxgUDUNtDg",
    "image_details": {
      "size": 7294868,
      "type": "image/jpeg",
      "width": 3000,
      "height": 2000,
      "sha256": "bfd0b7ca1963f8fd6505426a99ae525863260b5805a99480a639e026b75e953f"
    }
  }
}
