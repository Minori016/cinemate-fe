const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/booking/CheckoutResultPage.jsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* POINTS REDEMPTION \/ QUÀ ĐỔI ĐIỂM SECTION \*\/\}\r?\n\s*\{pointsRedemption && \([\s\S]*?<\/div>\r?\n\s*\)\}/;

if (content.match(regex)) {
    content = content.replace(regex, "");
    fs.writeFileSync(file, content, 'utf8');
    console.log("Removed duplicate points redemption section");
} else {
    console.log("Duplicate points redemption section not found");
}
