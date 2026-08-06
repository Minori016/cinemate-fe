const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'backend/cinemate/src/main/java/com/cinema/cinemate/service/BookingService.java');
let content = fs.readFileSync(file, 'utf8');

// Fix in holdSeats
const regexHold = /var validation = promotionService\.validateOnlyCampaign\(\s*bestCampaign\.getPromotion\(\),\s*booking\.getTickets\(\)\.isEmpty\(\)\s*\?\s*BigDecimal\.ZERO\s*:\s*ticketAmount\.divide\(BigDecimal\.valueOf\(booking\.getTickets\(\)\.size\(\)\),\s*2,\s*java\.math\.RoundingMode\.HALF_UP\)\);/;
const replaceHold = `
                        BigDecimal ticketAmountOnly = booking.getTotalAmount().subtract(totalConcessionAmount);
                        BigDecimal singleTicketPrice = (booking.getSeats() == null || booking.getSeats().isEmpty()) ? BigDecimal.ZERO : ticketAmountOnly.divide(BigDecimal.valueOf(booking.getSeats().size()), 2, java.math.RoundingMode.HALF_UP);
                        var validation = promotionService.validateOnlyCampaign(
                                bestCampaign.getPromotion(), singleTicketPrice);`;

content = content.replace(regexHold, replaceHold);

// Fix in mapToBookingResponse
const regexMap = /BigDecimal baseAmount = booking\.getTickets\(\)\.isEmpty\(\)\s*\?\s*BigDecimal\.ZERO\s*:\s*ticketAmount\.divide\(BigDecimal\.valueOf\(booking\.getTickets\(\)\.size\(\)\),\s*2,\s*java\.math\.RoundingMode\.HALF_UP\); \/\/ campaign chỉ giảm trên 1 ghế/;
const replaceMap = `BigDecimal baseAmount = (booking.getSeats() == null || booking.getSeats().isEmpty()) ? BigDecimal.ZERO : ticketAmount.divide(BigDecimal.valueOf(booking.getSeats().size()), 2, java.math.RoundingMode.HALF_UP); // campaign chỉ giảm trên 1 ghế`;

content = content.replace(regexMap, replaceMap);

fs.writeFileSync(file, content, 'utf8');
console.log("BookingService corrected");
