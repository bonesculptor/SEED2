import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = '/tmp/cc-agent/61705039/project/.env';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PROJECT_ROOT = '/tmp/cc-agent/61705039/project';

const BINARY_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp3', '.mp4', '.wav', '.avi', '.mov',
  '.zip', '.tar', '.gz', '.rar',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx'
];

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.cache',
  'coverage',
  '.vscode',
  '.idea',
  'package-lock.json'
];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function isBinaryFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.includes(ext);
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.ts': 'text/typescript',
    '.tsx': 'text/typescript',
    '.js': 'text/javascript',
    '.jsx': 'text/javascript',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.css': 'text/css',
    '.html': 'text/html',
    '.sql': 'text/sql',
    '.txt': 'text/plain',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);

    if (shouldIgnore(fullPath)) {
      return;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function getAllDirectories(dirPath: string, arrayOfDirs: string[] = []): string[] {
  arrayOfDirs.push(dirPath);
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);

    if (shouldIgnore(fullPath)) {
      return;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfDirs = getAllDirectories(fullPath, arrayOfDirs);
    }
  });

  return arrayOfDirs;
}

async function importFiles() {
  console.log('Starting project file import...');
  console.log(`Project root: ${PROJECT_ROOT}`);

  const { data: existingFiles } = await supabase
    .from('project_files')
    .select('id')
    .limit(1);

  if (existingFiles && existingFiles.length > 0) {
    console.log('Clearing existing files...');
    await supabase.from('project_files').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('project_structure').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }

  const directories = getAllDirectories(PROJECT_ROOT);
  console.log(`Found ${directories.length} directories`);

  for (const dir of directories) {
    const relativePath = path.relative(PROJECT_ROOT, dir);
    const parentPath = path.dirname(relativePath);
    const depth = relativePath === '' ? 0 : relativePath.split(path.sep).length;

    await supabase.from('project_structure').insert({
      path: relativePath || '.',
      parent_path: parentPath === '.' ? null : parentPath,
      depth
    });
  }

  console.log('Directory structure imported');

  const files = getAllFiles(PROJECT_ROOT);
  console.log(`Found ${files.length} files to import`);

  let imported = 0;
  let skipped = 0;
  let totalSize = 0;

  for (const filePath of files) {
    try {
      const relativePath = path.relative(PROJECT_ROOT, filePath);
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath);
      const directoryPath = path.dirname(relativePath);
      const isBinary = isBinaryFile(filePath);
      const contentType = getContentType(filePath);

      let content = '';
      let fileSize = 0;

      if (isBinary) {
        fileSize = fs.statSync(filePath).size;
        content = `[Binary file: ${fileName}]`;
      } else {
        try {
          content = fs.readFileSync(filePath, 'utf-8');
          fileSize = Buffer.byteLength(content, 'utf-8');
        } catch (err) {
          console.warn(`Could not read file: ${relativePath}`, err);
          skipped++;
          continue;
        }
      }

      const { error } = await supabase.from('project_files').insert({
        file_path: relativePath,
        file_name: fileName,
        file_extension: fileExtension,
        content,
        content_type: contentType,
        file_size: fileSize,
        is_binary: isBinary,
        directory_path: directoryPath
      });

      if (error) {
        console.error(`Error importing ${relativePath}:`, error);
        skipped++;
      } else {
        imported++;
        totalSize += fileSize;
        if (imported % 50 === 0) {
          console.log(`Imported ${imported} files...`);
        }
      }
    } catch (err) {
      console.error(`Error processing file ${filePath}:`, err);
      skipped++;
    }
  }

  await supabase.from('export_snapshots').insert({
    snapshot_name: `Full Import ${new Date().toISOString()}`,
    file_count: imported,
    total_size: totalSize,
    metadata: {
      directories: directories.length,
      skipped_files: skipped,
      project_root: PROJECT_ROOT
    }
  });

  console.log('\n=== Import Complete ===');
  console.log(`Files imported: ${imported}`);
  console.log(`Files skipped: ${skipped}`);
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Directories: ${directories.length}`);
}

importFiles().catch(console.error);
