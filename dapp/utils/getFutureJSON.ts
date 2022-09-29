
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
    "created_by": "Ph101pp",
    "external_url": `https://ph101pp.xyz/daily-photo/${dateString}`,
    "description": `This photo will be taken on ${weekday} ${formattedDate}.`,
    "attributes": [
      {
        "trait_type": "Artist",
        "value": "Ph101pp"
      },
      {
        "trait_type": "Collection",
        "value": "Daily Photo"
      },
      {
        "trait_type": "Revealed",
        "value": false
      },
      {
        "trait_type": "Weekday",
        "value": weekday
      },
      {
        "trait_type": "Month Name",
        "value": months[month]
      },
      {
        "trait_type": "Month",
        "value": month+1
      },
      {
        "trait_type": "Year",
        "value": year
      },
      {
        "trait_type": "Day",
        "value": day,
      }
    ],
    "image": "https://arweave.net/xbJD03bT9-5XGHIrFp6TfCsu_6zXBNUiRffS2IVifU4",
    "image_url": "https://arweave.net/xbJD03bT9-5XGHIrFp6TfCsu_6zXBNUiRffS2IVifU4"
    };

  return metadata;
}
