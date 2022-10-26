import { MetadataType } from "./getBaseMetadata";

export default function getClaimMetadata(): MetadataType {
  return ({
    "name": "Claim - Daily Photo",
    "created_by": "Ph101pp",
    "external_url": "https://daily-photo.ph101pp.xyz/claim",
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
    "image": "https://arweave.net/X4LbCHKXFENNjfvxrRl_YmXq7-X7_a0LK1kxz7kR6LQ",
    "image_url": "https://arweave.net/X4LbCHKXFENNjfvxrRl_YmXq7-X7_a0LK1kxz7kR6LQ",
    "image_details": {
      "size": 7239642,
      "type": "image/jpeg",
      "width": 3000,
      "height": 2000,
      "sha256": "fdaa31384d3ea0caa45a73372a152fa7674f6fd7f5a071a1e48beb1c6a2099ba"
    }
  });
}
