const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/user/MovieDetailPage.jsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /const discountAmount = useMemo\(\(\) => \{/;
const replaceStr = `const singleTicketPrice = selectedSeats.length > 0 ? ticketPrice / selectedSeats.length : 0;
  const discountAmount = useMemo(() => {`;

if (!content.includes("const singleTicketPrice = selectedSeats.length > 0")) {
    content = content.replace(regex, replaceStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log("MovieDetailPage singleTicketPrice injected");
} else {
    console.log("MovieDetailPage singleTicketPrice already present");
}
