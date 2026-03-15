const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const packageJsonPath = path.join(process.cwd(), 'package.json');
const distPath = path.join(process.cwd(), 'dist');

function run(command, args) {
  const prettyCommand = `${command} ${args.join(' ')}`;
  console.log(`\n> ${prettyCommand}`);

  let executable = command;
  let executableArgs = args;

  if (process.platform === 'win32' && command === 'npm') {
    executable = 'cmd.exe';
    executableArgs = ['/d', '/s', '/c', 'npm', ...args];
  }

  const result = spawnSync(executable, executableArgs, {
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    console.error(`Error ejecutando: ${prettyCommand}`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`Fallo (${result.status || 1}) en: ${prettyCommand}`);
    process.exit(result.status || 1);
  }
}

function hasStagedChangesFor(filePath) {
  const result = spawnSync('git', ['diff', '--cached', '--quiet', '--', filePath], {
    stdio: 'ignore',
    shell: false,
  });

  return result.status === 1;
}

function incrementPatch(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Version invalida en package.json: ${version}`);
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]) + 1;

  return `${major}.${minor}.${patch}`;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function killAppProcesses() {
  const processes = ['DashboardEconomic.exe', 'electron.exe', 'Electron.exe'];
  for (const proc of processes) {
    spawnSync('taskkill', ['/F', '/IM', proc, '/T'], { shell: false });
  }
}

function cleanPreviousBuilds() {
  if (!fs.existsSync(distPath)) return;

  console.log('\nCerrando procesos Electron antes de limpiar...');
  killAppProcesses();
  sleep(2000);

  console.log(`Limpiando builds anteriores en: ${distPath}`);
  try {
    fs.rmSync(distPath, { recursive: true, force: true });
  } catch (err) {
    if (err.code === 'EBUSY' || err.code === 'EPERM') {
      console.warn(`Archivos aún bloqueados (${err.code}), reintentando en 3 segundos...`);
      sleep(3000);
      try {
        fs.rmSync(distPath, { recursive: true, force: true });
      } catch {
        console.warn('No se pudo limpiar dist/ completamente. Continuando de todos modos...');
      }
    } else {
      throw err;
    }
  }
}

function main() {
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('No se encontro package.json en la raiz del proyecto.');
  }

  const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageData.version;
  const nextVersion = incrementPatch(currentVersion);
  const tag = `v${nextVersion}`;

  packageData.version = nextVersion;
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageData, null, 2)}\n`, 'utf8');

  console.log(`Version actual: ${currentVersion}`);
  console.log(`Nueva version: ${nextVersion}`);

  cleanPreviousBuilds();

  run('npm', ['run', 'dist']);

  run('git', ['add', 'package.json']);

  if (hasStagedChangesFor('package.json')) {
    run('git', ['commit', '-m', `chore: version ${nextVersion}`]);
  } else {
    console.warn('No hay cambios en package.json para commitear. Se continua sin commit.');
  }

  run('git', ['tag', tag]);
  run('git', ['push', 'origin']);
  run('git', ['push', 'origin', tag]);

  console.log(`Proceso completado. Tag publicado: ${tag}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
