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
    "image": "https://arweave.net/S4OFT7mPFp55SISQGNnJrJBaQ2yHezZFCDj7v_d8n8c",
    "image_url": "https://arweave.net/S4OFT7mPFp55SISQGNnJrJBaQ2yHezZFCDj7v_d8n8c",
    "image_details":{
      "size":7108402,
      "type":"image/jpeg",
      "width":3000,
      "height":2000,
      "sha256":"5705984596ad2f71814de257d500fbd83150361ca1171cf61e68eaf4d210a3e0"
    }
  });
}
