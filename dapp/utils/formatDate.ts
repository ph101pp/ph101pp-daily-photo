
const months = ["January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December"];

const monthsShort = ["Jan.", "Feb.", "Mar.", "Apr.", "May.", "Jun.",
"Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];

export const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function formatDate(tokenDate: string) {
  const year = parseInt(tokenDate.slice(0, 4));
  const month = parseInt(tokenDate.slice(4, 6)) - 1;
  const day = parseInt(tokenDate.slice(6, 8));

  const date = new Date(year, month, day);
  const weekday = weekdays[date.getUTCDay()]
  return `${weekday}, ${months[month]} ${day}, ${year}`;
}