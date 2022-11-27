
const months = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const monthsShort = ["Jan.", "Feb.", "Mar.", "Apr.", "May.", "Jun.",
  "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

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
  const weekday = weekdays[date.getUTCDay()]
  const formattedDate = `${weekday}, ${months[month]} ${day}, ${year}`;
  const timestamp = Math.round(date.getTime() / 1000);

  return {
    "name": `#${tokenIndex.padStart(4, "0")} – ${formattedDate}`,
    "created_by": "Philipp Adrian",
    "external_url": `https://daily-photo.ph101pp.xyz/${tokenDate}-${tokenIndex}`,
    "attributes": [
      {
        "trait_type": "Artist",
        "value": "Ph101pp"
      },
      {
        "display_type": "number",
        "trait_type": "Photo #",
        "value": parseInt(tokenIndex)
      },
      {
        "display_type": "date",
        "trait_type": "Date",
        "value": timestamp
      },
      {
        "trait_type": "Weekday",
        "value": weekday
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
