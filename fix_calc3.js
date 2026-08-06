const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'backend/cinemate/src/main/java/com/cinema/cinemate/service/BookingService.java');
let content = fs.readFileSync(file, 'utf8');

const regex = /var validation = promotionService\.validateOnlyCampaign\(\s*bestCampaign\.getPromotion\(\),\s*booking\.getTotalAmount\(\)\);/;
const replaceStr = `var validation = promotionService.validateOnlyCampaign(
                                bestCampaign.getPromotion(), ticketAmount);`;

if (content.match(regex)) {
    content = content.replace(regex, replaceStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log("BookingService updated");
} else {
    console.log("BookingService already updated or not found");
}
