const fs = require('fs');

function updateJson(file, translations) {
  let c = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(c);
  
  if (!data.Threads) data.Threads = {};
  data.Threads.attachmentsLabel = translations.attachmentsLabel;
  if (!data.Threads.errors) data.Threads.errors = {};
  data.Threads.errors.invalidFileType = translations.invalidFileType;
  data.Threads.errors.tooManyFiles = translations.tooManyFiles;
  
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

updateJson('src/i18n/messages/en.json', {
  attachmentsLabel: "Attach file",
  invalidFileType: "Unsupported file format: {name}. Allowed: images, .txt, .log, .pdf, .zip, video, and .jar.",
  tooManyFiles: "No more than {max} attachments allowed."
});

updateJson('src/i18n/messages/ru.json', {
  attachmentsLabel: "Прикрепить файл",
  invalidFileType: "Неподдерживаемый формат файла: {name}. Разрешены: картинки, .txt, .log, .pdf, .zip, видео и .jar.",
  tooManyFiles: "Разрешено не более {max} вложений."
});

console.log("added threads translations");
