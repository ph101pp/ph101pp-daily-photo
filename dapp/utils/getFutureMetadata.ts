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
    "image": "ar://ETzoxfKjsr5dZqWy-vlsQKV3iJnb2K7RICsQfHWASxM",
    "image_url": "ar://ETzoxfKjsr5dZqWy-vlsQKV3iJnb2K7RICsQfHWASxM",
    "image_details": {
      "size": 2856048,
      "type": "image/jpeg",
      "width": 3000,
      "height": 2000,
      "sha256": "c8707f747d32151a1e914f7759170bace6d82792afa84526bf328ed0ca2f65f0"
    }
  }
}
