const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/user/MovieDetailPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Move singleTicketPrice to component scope if not there
if (!content.includes('const singleTicketPrice = selectedSeats.length > 0')) {
    content = content.replace(
        "const discountAmount = useMemo(() => {",
        "const singleTicketPrice = selectedSeats.length > 0 ? ticketPrice / selectedSeats.length : 0;\n  const discountAmount = useMemo(() => {"
    );
}

// 2. Remove singleTicketPrice from inside useMemo if we moved it
const innerSingleTickRegex = /const singleTicketPrice = selectedSeats\.length > 0 \? ticketPrice \/ selectedSeats\.length : 0\r?\n\s*/;
content = content.replace(innerSingleTickRegex, ""); // Remove the duplicate inside useMemo

// 3. Update the UI block
const uiRegex = /\-\{autoCampaign\.discountPercent > 0[\s\S]*?\? Number\(Math\.round\(\(ticketPrice \+ comboPrice\) \* \(autoCampaign\.discountPercent \/ 100\)\)\)\.toLocaleString\('vi-VN'\)[\s\S]*?: Number\(autoCampaign\.discountValue\)\.toLocaleString\('vi-VN'\)\} đ/;
const uiReplace = `-{autoCampaign.discountPercent > 0 
                        ? Number(Math.round(singleTicketPrice * (autoCampaign.discountPercent / 100))).toLocaleString('vi-VN') 
                        : Number(Math.min(autoCampaign.discountValue, singleTicketPrice)).toLocaleString('vi-VN')} đ`;

content = content.replace(uiRegex, uiReplace);

fs.writeFileSync(file, content, 'utf8');
console.log("UI calculation fixed");
