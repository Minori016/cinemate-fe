const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/user/MovieDetailPage.jsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /const discountAmount = useMemo\(\(\) => \{[\s\S]*?\}, \[(.*?)\]\)/;
content = content.replace(regex, (match, deps) => {
    return `const discountAmount = useMemo(() => {
    let couponDiscount = 0
    if (discount > 0) {
      if (discount < 1) {
        couponDiscount = Math.round((ticketPrice + comboPrice) * discount)
      } else {
        couponDiscount = discount
      }
    }
    let campaignDiscount = 0
    const singleTicketPrice = selectedSeats.length > 0 ? ticketPrice / selectedSeats.length : 0
    if (autoCampaign) {
      if (autoCampaign.discountPercent > 0) {
        campaignDiscount = Math.round(singleTicketPrice * (autoCampaign.discountPercent / 100))
      } else if (autoCampaign.discountValue > 0) {
        campaignDiscount = Math.min(autoCampaign.discountValue, singleTicketPrice)
      }
    }
    const totalDiscount = couponDiscount + pointsDiscount + campaignDiscount
    return Math.min(totalDiscount, ticketPrice + comboPrice)
  }, [discount, ticketPrice, comboPrice, pointsDiscount, autoCampaign, selectedSeats.length])`;
});
fs.writeFileSync(file, content, 'utf8');
console.log("MovieDetailPage updated to use singleTicketPrice");
