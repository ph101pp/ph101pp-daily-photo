import getBaseMetadata, { MetadataType } from "./getBaseMetadata";

export default function getFutureMetadata(dateString: string, tokenIndex: string): MetadataType {
  const baseMetadata = getBaseMetadata(dateString, tokenIndex);
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
    "image": "https://arweave.net/Tm6hxGnIE-eEMwNyvOEb1NdZMAPBeSQ-HrME1haIOxA",
    "image_url": "https://arweave.net/Tm6hxGnIE-eEMwNyvOEb1NdZMAPBeSQ-HrME1haIOxA",
    "image_details": {
      "size": 3070599,
      "type": "image/jpeg",
      "width": 3000,
      "height": 2000,
      "sha256": "88c84df0192ae34918b03631d49eba04cd03eb1c7f9866a4f77519c1fe97dc3e"
    }
  }
}
