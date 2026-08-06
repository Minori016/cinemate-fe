const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/user/MovieDetailPage.jsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /const discountAmount = useMemo\(\(\) => \{[\s\S]*?\}, \[(.*?)\]\)/;
if (!content.includes("campaignDiscount")) {
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
    if (autoCampaign) {
      if (autoCampaign.discountPercent > 0) {
        campaignDiscount = Math.round((ticketPrice + comboPrice) * (autoCampaign.discountPercent / 100))
      } else if (autoCampaign.discountValue > 0) {
        campaignDiscount = autoCampaign.discountValue
      }
    }
    const totalDiscount = couponDiscount + pointsDiscount + campaignDiscount
    return Math.min(totalDiscount, ticketPrice + comboPrice)
  }, [discount, ticketPrice, comboPrice, pointsDiscount, autoCampaign])`;
    });
    fs.writeFileSync(file, content, 'utf8');
    console.log("Replaced discount calculation successfully");
} else {
    console.log("Already replaced");
}
