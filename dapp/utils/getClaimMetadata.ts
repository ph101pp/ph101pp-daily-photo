import { TokenMetadataInputType } from "../components/_types/TokenMetadataInputType";
import { MetadataType } from "./getBaseMetadata";

export default function getClaimMetadata({
  image_details,
  imageTx
}:{
  image_details: TokenMetadataInputType["image_details"],
  imageTx: string
}): MetadataType {
  return ({
    "name": "Claim - One Daily Photo",
    "created_by": "Ph101pp",
    "external_url": "https://daily-photo.ph101pp.xyz/CLAIM-0",
    "description": "This claim is redeemable for one photo from the Ph101pp Daily Photo collection.",
    "attributes": [
      {
        "trait_type": "Artist",
        "value": "Ph101pp"
      },
      {
        "trait_type": "Type",
        "value": "Claim"
      },
    ],
    "image": `ar://${imageTx}`,
    "image_url": `ar://${imageTx}`,
    "image_details": image_details
  });
}
