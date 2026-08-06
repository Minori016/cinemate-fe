const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/booking/CheckoutResultPage.jsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /\{discountAmount > 0 && \(\r?\n\s*<div className="flex justify-between items-center text-emerald-400 font-medium">/;
const replaceStr = `{bookingDetails.campaignDiscount > 0 && (
                          <div className="flex justify-between items-center text-emerald-400 font-medium">
                            <span>Khuyến Mãi Tự Động {bookingDetails.campaignTitle ? \`(\${bookingDetails.campaignTitle})\` : ""}:</span>
                            <span className="font-extrabold">
                              -{formatPrice(bookingDetails.campaignDiscount)}
                            </span>
                          </div>
                        )}

                        {discountAmount > 0 && (
                          <div className="flex justify-between items-center text-emerald-400 font-medium">`;

if (content.includes("Khuyến Mãi Tự Động") == false) {
    content = content.replace(regex, replaceStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log("CheckoutResultPage updated");
} else {
    console.log("CheckoutResultPage already updated or not found");
}
