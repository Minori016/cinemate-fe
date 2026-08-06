const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/staff/ticketing/StaffTicketingPage.jsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /const campaignDiscount = React\.useMemo\(\(\) => \{[\s\S]*?\}, \[autoCampaign, ticketPriceTotal\]\);/;
const replaceStr = `const campaignDiscount = React.useMemo(() => {
    if (!autoCampaign) return 0;
    if (autoCampaign.discountPercent > 0) {
      return Math.round(singleTicketPrice * (autoCampaign.discountPercent / 100));
    } else if (autoCampaign.discountValue > 0) {
      return Math.min(autoCampaign.discountValue, singleTicketPrice);
    }
    return 0;
  }, [autoCampaign, singleTicketPrice]);`;

if (content.includes("ticketPriceTotal * (autoCampaign.discountPercent")) {
    content = content.replace(regex, replaceStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log("StaffTicketingPage updated to use singleTicketPrice");
} else {
    console.log("StaffTicketingPage already updated or not found");
}
