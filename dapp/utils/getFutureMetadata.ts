import formatDate from "./formatDate";
import getBaseMetadata, { MetadataType } from "./getBaseMetadata";

export default function getFutureMetadata(dateString: string, tokenIndex: string): MetadataType {
  const baseMetadata = getBaseMetadata(dateString, tokenIndex);
  const formattedDate = formatDate(dateString);
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
    "image": "https://arweave.net/NkXul8Lsv3LGGkwMt5LJ7USOZ_GaVcBx9SimH7zObbI",
    "image_url": "https://arweave.net/NkXul8Lsv3LGGkwMt5LJ7USOZ_GaVcBx9SimH7zObbI",
    "image_details": {
      "size": 2780151,
      "type": "image/jpeg",
      "width": 3000,
      "height": 2000,
      "sha256": "bb6e6b60a5ed05f873c60d85af676b73746264ac6d4e4e3b648692d8696bd3df"
    }
  }
}
