const fs = require('fs');
const files = [
  'src/core/ActionNormalizer.ts',
  'src/core/SecurityEngine.ts',
  'src/adapters/HookAdapter.ts',
  'src/adapters/LegacyAdapter.ts'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // 移除所有非 ASCII 字符
    const cleaned = content.replace(/[^\x00-\x7F]/g, '');
    fs.writeFileSync(file, cleaned, 'utf8');
    console.log('Cleaned: ' + file);
  }
});
