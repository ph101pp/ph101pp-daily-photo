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
    "image": "https://arweave.net/fqJ7WSScPqL0bu14tPNHdsnewH0HR583Jy9eSxz8TrE",
    "image_url": "https://arweave.net/fqJ7WSScPqL0bu14tPNHdsnewH0HR583Jy9eSxz8TrE",
    "image_details":{
      "size":7196240,
      "type":"image/jpeg",
      "width":3000,
      "height":2000,
      "sha256":"6a49f0746fa147fdebb460b62bbdc08d8d95637cbc8751c2e717f811799803c0"
    }
  }
}
