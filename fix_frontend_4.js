const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/user/MovieDetailPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the broken block
const brokenBlock = `              {/* Auto Campaign Info */}
              {autoCampaign && (
                <div className="flex flex-col gap-1 border-t border-white/5 pt-3">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold leading-none">Khuyến Mãi Tự Động</span>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-500 font-bold">{autoCampaign.title}</span>
                    <span className="text-emerald-500 font-bold">
                      -{autoCampaign.discountPercent > 0 
                        ? Number(Math.round((ticketPrice + comboPrice) * (autoCampaign.discountPercent / 100))).toLocaleString('vi-VN') 
                        : Number(autoCampaign.discountValue).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              )}`;

if (content.includes(brokenBlock)) {
    content = content.replace(brokenBlock, "");
}

// 2. Insert properly before Points Redemption Info
const targetStr = "{/* Points Redemption Info */}";
if (content.includes(targetStr) && !content.includes("Khuyến Mãi Tự Động")) {
    content = content.replace(targetStr, `{/* Auto Campaign Info */}
              {autoCampaign && (
                <div className="flex flex-col gap-1 border-t border-white/5 pt-3">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold leading-none">Khuyến Mãi Tự Động</span>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-500 font-bold">{autoCampaign.title}</span>
                    <span className="text-emerald-500 font-bold">
                      -{autoCampaign.discountPercent > 0 
                        ? Number(Math.round((ticketPrice + comboPrice) * (autoCampaign.discountPercent / 100))).toLocaleString('vi-VN') 
                        : Number(autoCampaign.discountValue).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              )}

              {/* Points Redemption Info */}`);
}

fs.writeFileSync(file, content, 'utf8');
console.log("Success");
