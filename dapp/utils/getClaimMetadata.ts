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
    "image": "https://arweave.net/mTCnJgbuqyHsTp3yZRC-X9xx7hij9XZ11BZc5ksqkQQ",
    "image_url": "https://arweave.net/mTCnJgbuqyHsTp3yZRC-X9xx7hij9XZ11BZc5ksqkQQ",
    "image_details": {
      "size": 7159141,
      "type": "image/jpeg",
      "width": 3000,
      "height": 2000,
      "sha256": "b253a99a1a998b24a692bbc5f9e0cd3270e7b308d59b607dce300ca8ab6b3505"
    }
  });
}
