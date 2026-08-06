const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/staff/ticketing/StaffTicketingPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// Add autoCampaign state
content = content.replace(
  "const [couponDiscount, setCouponDiscount] = useState(0)",
  "const [couponDiscount, setCouponDiscount] = useState(0)\n  const [autoCampaign, setAutoCampaign] = useState(null)"
);

// Add useEffect to fetch campaigns based on selectedMovie
const startStr = "const finalPriceTotal = Math.max(0, grossOrderTotal - pointsDiscountTotal - couponDiscount)";
content = content.replace(startStr, `
  // Auto-fetch and apply CAMPAIGN
  React.useEffect(() => {
    if (!selectedMovie?.id) return;
    let cancelled = false;
    promotionService.getActiveForUi().then(list => {
      if (cancelled) return;
      if (Array.isArray(list)) {
        const campaigns = list.filter(p => p.promotionType === 'CAMPAIGN' && p.movieIds?.includes(selectedMovie.id));
        if (campaigns.length > 0) {
          const bestCampaign = campaigns.reduce((prev, current) => 
            (prev.discountPercent > current.discountPercent) ? prev : current
          );
          setAutoCampaign(bestCampaign);
        } else {
          setAutoCampaign(null);
        }
      }
    });
    return () => { cancelled = true };
  }, [selectedMovie?.id]);

  const campaignDiscount = React.useMemo(() => {
    if (!autoCampaign) return 0;
    if (autoCampaign.discountPercent > 0) {
      return Math.round(grossOrderTotal * (autoCampaign.discountPercent / 100));
    } else if (autoCampaign.discountValue > 0) {
      return autoCampaign.discountValue;
    }
    return 0;
  }, [autoCampaign, grossOrderTotal]);

  const finalPriceTotal = Math.max(0, grossOrderTotal - pointsDiscountTotal - couponDiscount - campaignDiscount)`);

// Render campaign info in step 3
content = content.replace(
  "{(couponDiscount > 0 || pointsDiscountTotal > 0) && (",
  "{(couponDiscount > 0 || pointsDiscountTotal > 0 || campaignDiscount > 0) && ("
);

content = content.replace(
  "<span>-{formatVND(couponDiscount + pointsDiscountTotal)}</span>",
  "<span>-{formatVND(couponDiscount + pointsDiscountTotal + campaignDiscount)}</span>"
);

content = content.replace(
  "{couponDiscount > 0 && (",
  "{campaignDiscount > 0 && (\n                          <div className=\"flex justify-between items-center text-emerald-400 font-bold\">\n                            <span>Khuyến Mãi Tự Động ({autoCampaign.title}):</span>\n                            <span className=\"font-mono\">-{formatVND(campaignDiscount)}</span>\n                          </div>\n                        )}\n\n                        {couponDiscount > 0 && ("
);

// Render campaign info in receipt
const receiptStr = "{couponDiscount > 0 && (\\s*<div className=\"space-y-1 border-t border-white/5 pt-4\">)";
const regexReceipt = /\{couponDiscount > 0 && \([\s\S]*?\{appliedPromoCode\}<\/span>[\s\S]*?<\/div>\s*\)\}/;
content = content.replace(regexReceipt, (match) => {
  return match + `\n\n              {campaignDiscount > 0 && (\n                <div className="space-y-1 border-t border-white/5 pt-4">\n                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">KHUYẾN MÃI TỰ ĐỘNG</span>\n                  <div className="flex justify-between items-center text-xs">\n                    <span className="text-emerald-400 font-bold">{autoCampaign?.title}</span>\n                    <span className="text-emerald-400 font-mono font-bold">-{formatVND(campaignDiscount)}</span>\n                  </div>\n                </div>\n              )}`;
});

fs.writeFileSync(file, content, 'utf8');
console.log("Success");
