const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/booking/CheckoutResultPage.jsx');
let content = fs.readFileSync(file, 'utf8');

const regexLeft = /\{\/\* QR & Barcode Section \*\/\}\r?\n\s*<div className="pt-2 border-t border-white\/10 flex flex-col sm:flex-row gap-2\.5 items-center justify-between bg-black\/20 p-2 rounded-lg">\r?\n\s*<div className="flex-1 text-left">\r?\n\s*<p className="text-\[10px\] font-bold text-white mb-0\.5">Quy định soát vé:<\/p>\r?\n\s*<p className="text-\[9px\] text-gray-400 leading-tight">\r?\n\s*Vui lòng đến rạp trước 15 phút và xuất trình mã QR này trên điện thoại để quét mã vào phòng chiếu\.\r?\n\s*<\/p>\r?\n\s*<\/div>\r?\n\s*<div className="flex flex-col items-center shrink-0 bg-white p-1 rounded-md border border-red-600 shadow-xs">\r?\n\s*<img \r?\n\s*src=\{`https:\/\/api\.qrserver\.com\/v1\/create-qr-code\/\?size=65x65&data=\$\{bookingDetails\.id\}&bgcolor=ffffff&color=000000`\} \r?\n\s*alt="Mã QR Soát Vé" \r?\n\s*className="w-14 h-14 block" \r?\n\s*\/>\r?\n\s*<span className="text-\[7\.5px\] text-gray-800 font-mono font-bold mt-0\.5 tracking-tighter">\r?\n\s*\{bookingDetails\.id\?\.substring\(0, 12\)\.toUpperCase\(\)\}\r?\n\s*<\/span>\r?\n\s*<\/div>\r?\n\s*<\/div>/;

const replaceLeft = `{/* Rules Section */}
                    <div className="pt-2 border-t border-white/10 flex flex-col gap-1 items-start bg-black/20 p-2 rounded-lg">
                      <p className="text-[10px] font-bold text-white mb-0.5 flex items-center gap-1">
                        Quy định soát vé:
                      </p>
                      <p className="text-[9px] text-gray-400 leading-tight">
                        Vui lòng đến rạp trước 15 phút và xuất trình mã QR trên vé để quét mã vào phòng chiếu.
                      </p>
                    </div>`;

const regexRight = /<div className="flex justify-between">\r?\n\s*<span className="text-gray-400">Suất:<\/span>\r?\n\s*<span className="font-bold text-white">\{bookingDetails\.showtime\} - \{bookingDetails\.date\}<\/span>\r?\n\s*<\/div>\r?\n\s*<\/div>\r?\n\s*<\/div>/;

const replaceRight = `<div className="flex justify-between">
                          <span className="text-gray-400">Suất:</span>
                          <span className="font-bold text-white">{bookingDetails.showtime} - {bookingDetails.date}</span>
                        </div>
                      </div>

                      {/* QR Code inside Right Pane */}
                      <div className="flex flex-col items-center bg-white p-1.5 rounded-md border border-red-600 shadow-xs mb-3">
                        <img 
                          src={\`https://api.qrserver.com/v1/create-qr-code/?size=75x75&data=\${bookingDetails.id}&bgcolor=ffffff&color=000000\`} 
                          alt="Mã QR Soát Vé" 
                          className="w-16 h-16 block" 
                        />
                        <span className="text-[8.5px] text-gray-800 font-mono font-bold mt-0.5 tracking-tighter">
                          {bookingDetails.id?.substring(0, 12).toUpperCase()}
                        </span>
                      </div>
                    </div>`;

if (content.match(regexLeft)) {
    content = content.replace(regexLeft, replaceLeft);
    if (content.match(regexRight)) {
        content = content.replace(regexRight, replaceRight);
        fs.writeFileSync(file, content, 'utf8');
        console.log("Moved QR code to the right pane successfully.");
    } else {
        console.log("regexRight not found");
    }
} else {
    console.log("regexLeft not found");
}
