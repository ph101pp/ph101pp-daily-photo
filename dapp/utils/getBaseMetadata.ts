import formatDate, { weekdays } from "./formatDate";

export type BaseMetadataType = {
  "name": string,
  "created_by": string,
  "external_url": string,
  "attributes": Array<{
    "trait_type": string,
    "value": string | number | boolean,
    "display_type"?: string,
    "max_value"?: string | number,
  }>
}

export type MetadataType = {
  "description": string,
  "image": string,
  "image_url": string
  "image_details": {
    "size": number,
    "type": string,
    "width": number,
    "height": number,
    "sha256": string
  }
} & BaseMetadataType;


export default function getBaseMetadata(tokenDate: string, tokenIndex: string): BaseMetadataType {
  const year = parseInt(tokenDate.slice(0, 4));
  const month = parseInt(tokenDate.slice(4, 6)) - 1;
  const day = parseInt(tokenDate.slice(6, 8));

  const date = new Date(year, month, day);
  const timestamp = Math.ceil(date.getTime() / 1000);
  const formattedDate = formatDate(tokenDate);
  const paddedNumber = parseInt(tokenIndex) > 9999 ? tokenIndex : `#${tokenIndex.padStart(4, "0")}`

  return {
    "name": `${paddedNumber} – ${formattedDate}`,
    "created_by": "Philipp Adrian",
    "external_url": `https://daily-photo.ph101pp.xyz/${tokenDate}-${tokenIndex}`,
    "attributes": [
      {
        "trait_type": "Artist",
        "value": "Ph101pp"
      },
      {
        "trait_type": "Photo Nº",
        "value": parseInt(tokenIndex)
      },
      {
        "display_type": "date",
        "trait_type": "Date",
        "value": timestamp
      },
      {
        "trait_type": "Weekday",
        "value": weekdays[day]
      },
      {
        "display_type": "number",
        "trait_type": "Month",
        "value": month + 1
      },
      {
        "display_type": "number",
        "trait_type": "Year",
        "value": year
      },
      {
        "display_type": "number",
        "trait_type": "Day",
        "value": day,
      }
    ],
  };
}
