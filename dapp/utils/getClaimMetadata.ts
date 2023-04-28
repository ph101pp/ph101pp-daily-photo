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
    "created_by": "Philipp Adrian (Ph101pp)",
    "external_url": "https://daily.ph101pp.xyz/claim",
    "description": `This claim is redeemable for one photo from the Ph101pp Daily collection.

[Redeem](https://daily.ph101pp.xyz/claim)`,
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
