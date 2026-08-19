const fs = require('fs');

let c = fs.readFileSync('src/components/threads/ThreadView.tsx', 'utf8');

c = c.replace(
  /<label[\s\S]*?<Paperclip[\s\S]*?<input[\s\S]*?<\/label>\s*<FormButton[\s\S]*?<\/FormButton>/,
  match => `<div className="flex items-center gap-2">\n            ${match}\n          </div>`
);

fs.writeFileSync('src/components/threads/ThreadView.tsx', c);
console.log("Fixed layout");
