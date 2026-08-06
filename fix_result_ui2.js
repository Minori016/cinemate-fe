const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/booking/CheckoutResultPage.jsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /\{discountAmount > 0 && \(\r?\n\s*<div className="flex justify-between items-center text-emerald-400 font-medium">\r?\n\s*<span>Mã giảm giá \{bookingDetails\.promotionCode \? `\(\$\{bookingDetails\.promotionCode\}\)` : ""\}:<\/span>\r?\n\s*<span className="font-extrabold">\r?\n\s*-\{formatPrice\(discountAmount\)\}\r?\n\s*<\/span>\r?\n\s*<\/div>\r?\n\s*\)\}/;

const replaceStr = `{discountAmount - (bookingDetails.campaignDiscount || 0) > 0 && (
                          <div className="flex justify-between items-center text-emerald-400 font-medium">
                            <span>Mã giảm giá {bookingDetails.promotionCode && bookingDetails.promotionCode !== bookingDetails.campaignTitle ? \`(${bookingDetails.promotionCode})\` : ""}:</span>
                            <span className="font-extrabold">
                              -{formatPrice(discountAmount - (bookingDetails.campaignDiscount || 0))}
                            </span>
                          </div>
                        )}`;

if (content.match(regex)) {
    content = content.replace(regex, replaceStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log("CheckoutResultPage Mã giảm giá block updated");
} else {
    console.log("CheckoutResultPage Mã giảm giá block already updated or not found");
}
