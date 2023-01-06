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
    "image": "ar://yFPEI60kQ5BK8ANO3ggtzZS1Z50IhCI4pI2gVaX5qbk",
    "image_url": "ar://yFPEI60kQ5BK8ANO3ggtzZS1Z50IhCI4pI2gVaX5qbk",
    "image_details": {
      "size": 3050814,
      "type": "image/jpeg",
      "width": 3000,
      "height": 2000,
      "sha256": "1158dc7988f4ec51040bef11de665f9471bdbeb8234eee89f83e77a242ff23d7"
    }
  }
}
