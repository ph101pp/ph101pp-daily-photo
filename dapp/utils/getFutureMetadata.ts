import getBaseMetadata, { MetadataType } from "./getBaseMetadata";

export default function getFutureMetadata(dateString: string, tokenIndex:string): MetadataType {
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
    "image": "https://arweave.net/h84usgjkPP50GFKifpX3Dgvf4xFGi3AMVM-Cw61u8tg",
    "image_url": "https://arweave.net/h84usgjkPP50GFKifpX3Dgvf4xFGi3AMVM-Cw61u8tg",
    "image_details": {
      "size": 7227767,
      "type": "image/jpeg",
      "width": 3000,
      "height": 2000,
      "sha256": "8b1a93d4ae514211449936dd5248c7d57ac61fe0a2dd934996d2064428b11887"
    }
  }
}
