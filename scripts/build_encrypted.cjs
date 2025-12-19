const fs = require('fs');
const path = require('path');
const crypto = require('crypto-js');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');

// constants.ts의 DATA_KEY와 반드시 동일해야 합니다.
const DATA_KEY = 'HoneyCounseling2025!@#Secure';

const targets = [
  path.join(root, 'public', 'data', 'univ_rules.json'),
  path.join(root, 'public', 'data', 'score_table.json'),
  path.join(root, 'public', 'data', 'admission_data.json'),
  path.join(root, 'public', 'data', 'conversion_table.json'),
];

function ensureFile(p) {
  if (!fs.existsSync(p)) {
    throw new Error(`파일이 없습니다: ${p}`);
  }
}

function backupPathFor(filePath, backupDir) {
  // public/data/xxx.json -> backupDir/public/data/xxx.json 형태로 저장
  const rel = path.relative(root, filePath);
  return path.join(backupDir, rel);
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function backupFiles(backupDir) {
  for (const file of targets) {
    ensureFile(file);
    const out = backupPathFor(file, backupDir);
    mkdirp(path.dirname(out));
    fs.copyFileSync(file, out);
  }
}

function restoreFiles(backupDir) {
  for (const file of targets) {
    const src = backupPathFor(file, backupDir);
    if (!fs.existsSync(src)) {
      throw new Error(`백업 파일이 없습니다(복구 불가): ${src}`);
    }
    fs.copyFileSync(src, file);
  }
}

function encryptInPlace() {
  for (const file of targets) {
    // UTF-8 BOM 처리: 바이너리로 읽어서 BOM 확인
    let plain;
    const buf = fs.readFileSync(file);
    // UTF-8 BOM 체크 (EF BB BF)
    if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
      plain = buf.slice(3).toString('utf8');
    } else {
      plain = buf.toString('utf8');
    }
    
    // 이미 암호문이어도 다시 암호화해도 되긴 하지만(복호 실패 가능),
    // 안전을 위해 JSON 파싱이 되면 "평문"으로 보고 암호화합니다.
    try {
      JSON.parse(plain);
    } catch {
      // JSON이 아니면 이미 암호문/텍스트일 수 있으니 그대로 두지 말고, 명확히 실패 처리
      throw new Error(`암호화 대상 파일이 JSON이 아닙니다(이미 암호화되었거나 손상): ${file}`);
    }

    const cipher = crypto.AES.encrypt(plain, DATA_KEY).toString();
    fs.writeFileSync(file, cipher, 'utf8');
  }
}

function runBuild() {
  const res = spawnSync('npm', ['run', 'build'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  if (res.status !== 0) {
    throw new Error(`빌드 실패 (exit code: ${res.status})`);
  }
}

function fixDistStructure() {
  // Cloudflare Pages를 위한 파일 구조 수정
  // base: '/js_cs/'로 설정되어 있으므로 실제 파일도 js_cs 폴더에 있어야 함
  const distPath = path.join(root, 'dist');
  const jsCsPath = path.join(distPath, 'js_cs');
  
  if (!fs.existsSync(jsCsPath)) {
    mkdirp(jsCsPath);
  }
  
  // assets 폴더를 js_cs/assets로 이동/복사
  const assetsSrc = path.join(distPath, 'assets');
  const assetsDest = path.join(jsCsPath, 'assets');
  const dataSrc = path.join(distPath, 'data');
  const dataDest = path.join(jsCsPath, 'data');
  
  if (fs.existsSync(assetsSrc)) {
    // assets 폴더가 이미 있으면 제거
    if (fs.existsSync(assetsDest)) {
      fs.rmSync(assetsDest, { recursive: true, force: true });
    }
    // assets 폴더 복사
    copyRecursiveSync(assetsSrc, assetsDest);
  }
  
  // data 폴더도 복사
  if (fs.existsSync(dataSrc)) {
    if (fs.existsSync(dataDest)) {
      fs.rmSync(dataDest, { recursive: true, force: true });
    }
    copyRecursiveSync(dataSrc, dataDest);
  }
  
  // index.html을 js_cs 폴더로 복사
  const indexSrc = path.join(distPath, 'index.html');
  const indexDest = path.join(jsCsPath, 'index.html');
  if (fs.existsSync(indexSrc)) {
    fs.copyFileSync(indexSrc, indexDest);
  }
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    mkdirp(dest);
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

(function main() {
  const backupDir = path.join(__dirname, '.enc_backup', String(Date.now()));
  mkdirp(backupDir);

  console.log('[1/3] 원본 JSON 백업:', backupDir);
  backupFiles(backupDir);

  try {
    console.log('[2/3] public/data JSON 암호화(파일 덮어쓰기)');
    encryptInPlace();

    console.log('[3/3] 빌드 실행 (dist에는 암호문이 복사됨)');
    runBuild();

    console.log('[4/4] Cloudflare Pages를 위한 파일 구조 수정');
    fixDistStructure();

    console.log('완료: dist/js_cs/* 가 암호화된 상태입니다.');
  } finally {
    console.log('원본 JSON 복구 중...');
    restoreFiles(backupDir);
    console.log('복구 완료: public/data/* 는 다시 평문 JSON입니다.');
  }
})();
