
const months = [ "January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December" ];

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function getFutureJSON(dateString: string): object {
  const year = parseInt(dateString.slice(0,4));
  const month = parseInt(dateString.slice(4,6))-1;
  const day = parseInt(dateString.slice(6,8));

  const date = new Date(year, month, day);
  const formattedDate = `${months[month]} ${day}, ${year}`;
  const weekday = weekdays[date.getUTCDay()]

  const metadata = {
    "name": formattedDate,
    "created_by": "ph101pp",
    "external_url": `https://ph101pp.xyz/daily-photo/${dateString}`,
    "description": `This photo will be taken on ${weekday} ${formattedDate}`,
    "attributes": [
      {
        "trait_type": "Artist",
        "value": "Philipp Adrian"
      },
      {
        "trait_type": "Collection",
        "value": "Daily Photo"
      },
      {
        "trait_type": "Weekday",
        "value": formattedDate
      },
      {
        "trait_type": "Month",
        "value": months[month]
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
        "max_value": "31"
      }
    ],
    "image": "https://arweave.net/xbJD03bT9-5XGHIrFp6TfCsu_6zXBNUiRffS2IVifU4",
    "image_url": "https://arweave.net/xbJD03bT9-5XGHIrFp6TfCsu_6zXBNUiRffS2IVifU4"
    };

  return metadata;
}
