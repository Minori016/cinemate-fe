const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'backend/cinemate/src/main/java/com/cinema/cinemate/service/BookingService.java');
let content = fs.readFileSync(file, 'utf8');

const regex = /BigDecimal baseAmount = ticketAmount; \/\/ campaign chỉ giảm trên vé/;
const replaceStr = `BigDecimal baseAmount = booking.getTickets().isEmpty() ? BigDecimal.ZERO : ticketAmount.divide(BigDecimal.valueOf(booking.getTickets().size()), 2, java.math.RoundingMode.HALF_UP); // campaign chỉ giảm trên 1 ghế`;

if (content.match(regex)) {
    content = content.replace(regex, replaceStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log("BookingService baseAmount updated");
} else {
    console.log("BookingService baseAmount already updated or not found");
}

const regex2 = /var validation = promotionService\.validateOnlyCampaign\(\s*bestCampaign\.getPromotion\(\),\s*ticketAmount\);/;
const replaceStr2 = `var validation = promotionService.validateOnlyCampaign(
                                bestCampaign.getPromotion(), booking.getTickets().isEmpty() ? BigDecimal.ZERO : ticketAmount.divide(BigDecimal.valueOf(booking.getTickets().size()), 2, java.math.RoundingMode.HALF_UP));`;

if (content.match(regex2)) {
    content = content.replace(regex2, replaceStr2);
    fs.writeFileSync(file, content, 'utf8');
    console.log("BookingService validateOnlyCampaign updated");
} else {
    console.log("BookingService validateOnlyCampaign already updated or not found");
}
