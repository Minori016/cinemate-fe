const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/booking/CheckoutResultPage.jsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /<img \r?\n\s*src=\{`https:\/\/api\.qrserver\.com\/v1\/create-qr-code\/\?size=75x75&data=\$\{bookingDetails\.id\}&bgcolor=ffffff&color=000000`\} \r?\n\s*alt="Mã QR Soát Vé" \r?\n\s*className="w-16 h-16 block" \r?\n\s*\/>/;

const replaceStr = `<img 
                          src={\`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=\${bookingDetails.id}&bgcolor=ffffff&color=000000\`} 
                          alt="Mã QR Soát Vé" 
                          className="w-24 h-24 block" 
                        />`;

if (content.match(regex)) {
    content = content.replace(regex, replaceStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log("QR Code enlarged successfully.");
} else {
    console.log("Regex not found");
}
