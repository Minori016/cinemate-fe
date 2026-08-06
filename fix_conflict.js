const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/admin/promotions/PromotionFormPage.jsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /<<<<<<< HEAD\r?\n(.*?)\r?\n=======\r?\n.*?\r?\n>>>>>>> [a-f0-9]+/s;
content = content.replace(regex, "$1");

fs.writeFileSync(file, content, 'utf8');
