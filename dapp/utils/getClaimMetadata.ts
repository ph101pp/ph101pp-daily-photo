import { MetadataType } from "./getBaseMetadata";

export default function getClaimMetadata(): MetadataType {
  return ({
    "name": "Claim - Daily Photo",
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
    "image": "https://arweave.net/h0VC9yAnIrT5WJTWBYJNF30Np1tTMEeqoUeX818k_Q8",
    "image_url": "https://arweave.net/h0VC9yAnIrT5WJTWBYJNF30Np1tTMEeqoUeX818k_Q8",
    "image_details": {
      "size": 7545841,
      "type": "image/jpeg",
      "width": 3000,
      "height": 2000,
      "sha256": "615e2cf15f64c0347a9ce2314836024696bc86715fa9201dcab624a5f4a8f8e5"
    }
  });
}
