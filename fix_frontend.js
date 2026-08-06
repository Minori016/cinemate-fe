const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/user/MovieDetailPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
content = content.replace(
  "import { concessionService } from '../../services/concessionService'",
  "import { concessionService } from '../../services/concessionService'\nimport { promotionService } from '../../services/promotionService'"
);

// 2. Add state
content = content.replace(
  "const [pointsRedemption, setPointsRedemption] = useState(null)",
  "const [pointsRedemption, setPointsRedemption] = useState(null)\n  const [autoCampaign, setAutoCampaign] = useState(null)"
);

// 3. Add useEffect
const useEffectStr = "// ── Fetch movie from API ──";
const nextUseEffectStr = "  // Tải danh sách bắp nước từ server";
const fetchMovieStart = content.indexOf(useEffectStr);
const fetchMovieEnd = content.indexOf(nextUseEffectStr, fetchMovieStart);
if (fetchMovieStart !== -1 && fetchMovieEnd !== -1) {
    const fetchMovieBlock = content.substring(fetchMovieStart, fetchMovieEnd);
    content = content.replace(fetchMovieBlock, fetchMovieBlock + `\n  // ── Auto-fetch and apply CAMPAIGN ──\n  useEffect(() => {\n    if (!movie?.id) return;\n    let cancelled = false;\n    promotionService.getActiveForUi().then(list => {\n      if (cancelled) return;\n      if (Array.isArray(list)) {\n        const campaigns = list.filter(p => p.promotionType === 'CAMPAIGN' && p.movieIds?.includes(movie.id));\n        if (campaigns.length > 0) {\n          const bestCampaign = campaigns.reduce((prev, current) => \n            (prev.discountPercent > current.discountPercent) ? prev : current\n          );\n          setAutoCampaign(bestCampaign);\n        } else {\n          setAutoCampaign(null);\n        }\n      }\n    });\n    return () => { cancelled = true };\n  }, [movie?.id]);\n\n`);
}

// 4. Modify discount calculation
const discountStartStr = "const discountAmount = useMemo(() => {\n    // Handle coupon discount";
const discountEndStr = "}, [discount, ticketPrice, comboPrice, pointsDiscount])";
const discountStart = content.indexOf(discountStartStr);
const discountEnd = content.indexOf(discountEndStr, discountStart) + discountEndStr.length;
if (discountStart !== -1 && discountEnd > discountStartStr.length) {
    const block = content.substring(discountStart, discountEnd);
    content = content.replace(block, `const discountAmount = useMemo(() => {
    let couponDiscount = 0
    if (discount > 0) {
      if (discount < 1) {
        couponDiscount = Math.round((ticketPrice + comboPrice) * discount)
      } else {
        couponDiscount = discount
      }
    }
    let campaignDiscount = 0
    if (autoCampaign) {
      if (autoCampaign.discountPercent > 0) {
        campaignDiscount = Math.round((ticketPrice + comboPrice) * (autoCampaign.discountPercent / 100))
      } else if (autoCampaign.discountValue > 0) {
        campaignDiscount = autoCampaign.discountValue
      }
    }
    const totalDiscount = couponDiscount + pointsDiscount + campaignDiscount
    return Math.min(totalDiscount, ticketPrice + comboPrice)
  }, [discount, ticketPrice, comboPrice, pointsDiscount, autoCampaign])`);
}

// 5. Render auto campaign
const renderStartStr = "{/* Promo code & Discount info */}";
const renderEndStr = ")}\n\n              {/* Points Redemption Info */}";
const renderStart = content.indexOf(renderStartStr);
const renderEnd = content.indexOf(renderEndStr, renderStart);
if (renderStart !== -1 && renderEnd !== -1) {
    const renderBlock = content.substring(renderStart, renderEnd + 2);
    content = content.replace(renderBlock, renderBlock + `\n\n              {/* Auto Campaign Info */}\n              {autoCampaign && (\n                <div className="flex flex-col gap-1 border-t border-white/5 pt-3">\n                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold leading-none">Khuyến Mãi Tự Động</span>\n                  <div className="flex justify-between items-center text-xs">\n                    <span className="text-emerald-500 font-bold">{autoCampaign.title}</span>\n                    <span className="text-emerald-500 font-bold">\n                      -{autoCampaign.discountPercent > 0 \n                        ? Number(Math.round((ticketPrice + comboPrice) * (autoCampaign.discountPercent / 100))).toLocaleString('vi-VN') \n                        : Number(autoCampaign.discountValue).toLocaleString('vi-VN')} đ\n                    </span>\n                  </div>\n                </div>\n              )}`);
}

fs.writeFileSync(file, content, 'utf8');
console.log("Success");
