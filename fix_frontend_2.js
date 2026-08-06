const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/user/MovieDetailPage.jsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /(\{\/\* Promo code & Discount info \*\/\}[\s\S]*?\}\))/;
if (!content.includes("Khuyến Mãi Tự Động")) {
    content = content.replace(regex, `$1\n\n              {/* Auto Campaign Info */}\n              {autoCampaign && (\n                <div className="flex flex-col gap-1 border-t border-white/5 pt-3">\n                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold leading-none">Khuyến Mãi Tự Động</span>\n                  <div className="flex justify-between items-center text-xs">\n                    <span className="text-emerald-500 font-bold">{autoCampaign.title}</span>\n                    <span className="text-emerald-500 font-bold">\n                      -{autoCampaign.discountPercent > 0 \n                        ? Number(Math.round((ticketPrice + comboPrice) * (autoCampaign.discountPercent / 100))).toLocaleString('vi-VN') \n                        : Number(autoCampaign.discountValue).toLocaleString('vi-VN')} đ\n                    </span>\n                  </div>\n                </div>\n              )}`);
    fs.writeFileSync(file, content, 'utf8');
    console.log("Replaced successfully");
} else {
    console.log("Already replaced");
}
