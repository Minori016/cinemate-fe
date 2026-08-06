const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/user/MovieDetailPage.jsx');
let content = fs.readFileSync(file, 'utf8');

const targetStr1 = "campaignDiscount = Math.round((ticketPrice + comboPrice) * (autoCampaign.discountPercent / 100))";
const replaceStr1 = "campaignDiscount = Math.round(ticketPrice * (autoCampaign.discountPercent / 100))";

const targetStr2 = "campaignDiscount = autoCampaign.discountValue";
const replaceStr2 = "campaignDiscount = Math.min(autoCampaign.discountValue, ticketPrice)";

if (content.includes(targetStr1)) {
    content = content.replace(targetStr1, replaceStr1);
    content = content.replace(targetStr2, replaceStr2);
    fs.writeFileSync(file, content, 'utf8');
    console.log("MovieDetailPage updated");
} else {
    console.log("MovieDetailPage already updated or not found");
}
