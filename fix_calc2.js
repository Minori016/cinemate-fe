const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/staff/ticketing/StaffTicketingPage.jsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /const campaignDiscount = React\.useMemo\(\(\) => \{[\s\S]*?\}, \[autoCampaign, grossOrderTotal\]\);/;
const replaceStr = `const campaignDiscount = React.useMemo(() => {
    if (!autoCampaign) return 0;
    if (autoCampaign.discountPercent > 0) {
      return Math.round(ticketPriceTotal * (autoCampaign.discountPercent / 100));
    } else if (autoCampaign.discountValue > 0) {
      return Math.min(autoCampaign.discountValue, ticketPriceTotal);
    }
    return 0;
  }, [autoCampaign, ticketPriceTotal]);`;

if (content.includes("grossOrderTotal * (autoCampaign.discountPercent")) {
    content = content.replace(regex, replaceStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log("StaffTicketingPage updated");
} else {
    console.log("StaffTicketingPage already updated or not found");
}
