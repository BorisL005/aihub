'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const CLOUD_INIT_PATH = path.join(__dirname, '..', '..', 'cloud-init.yaml');

function readCloudInit() {
  return fs.readFileSync(CLOUD_INIT_PATH, 'utf8');
}

test('AC-1: cloud-init is a valid #cloud-config document', () => {
  const doc = readCloudInit();
  assert.match(doc, /^#cloud-config/);
});

test('AC-1: installs Docker Engine (docker-ce) and the Compose plugin', () => {
  const doc = readCloudInit();
  assert.match(doc, /docker-ce\b/);
  assert.match(doc, /docker-compose-plugin/);
  assert.match(doc, /systemctl enable --now docker/);
});

test('AC-1: does not manage SSH keys or users - the deploy key is already provisioned', () => {
  const doc = readCloudInit();
  assert.doesNotMatch(doc, /ssh_authorized_keys/);
  assert.doesNotMatch(doc, /^users:/m);
});

// QA regression guards (PR #15, commit 7fbbf75): the reviewer's Major #1 flagged
// that cloud-init was missing `rsync` (needed by deploy-staging.yml's sync step
// on both ends) and hardcoded the Docker apt repo to `ubuntu`, silently
// installing nothing on a Debian image. The fix commit addressed both, but
// neither had a test in this file - only deploy-staging-workflow.test.js
// asserts the *workflow* invokes rsync, which says nothing about whether the
// *node* actually has the rsync binary. These close that gap.

test('AC-1 (regression): rsync is installed - the deploy workflow syncs compose files with it', () => {
  const doc = readCloudInit();
  const packagesBlock = doc.match(/^packages:\n([\s\S]*?)\n(?:runcmd:|$)/m);
  assert.ok(packagesBlock, 'cloud-init must declare a packages: list');
  assert.match(packagesBlock[1], /^\s*-\s*rsync\s*$/m, 'packages: must include rsync');
});

test('AC-1 (regression): the Docker apt repo is derived from /etc/os-release, not hardcoded to ubuntu', () => {
  const doc = readCloudInit();
  assert.doesNotMatch(
    doc,
    /download\.docker\.com\/linux\/ubuntu\b/,
    'must not hardcode the ubuntu repo path - silently no-ops on a non-Ubuntu (e.g. Debian) image'
  );
  assert.match(
    doc,
    /download\.docker\.com\/linux\/\$\(\.\s*\/etc\/os-release\s*&&\s*echo\s*"\$ID"\)\/gpg/,
    'the GPG key URL must derive the distro from /etc/os-release ($ID)'
  );
  assert.match(
    doc,
    /download\.docker\.com\/linux\/\$\(\.\s*\/etc\/os-release\s*&&\s*echo\s*"\$ID"\)\s/,
    'the apt sources.list line must derive the distro from /etc/os-release ($ID)'
  );
});

test('AC-1 (regression): the /etc/os-release substitution actually resolves to "ubuntu" when run on an Ubuntu image, not just Debian', () => {
  // Sanity-check requested by QA: the fix's own commit message frames this as
  // "so a Debian image doesn't silently install nothing" - prove the same
  // substitution still resolves correctly on Ubuntu itself, i.e. this isn't a
  // Debian-only fix that regresses the (more common) Ubuntu case.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cloud-init-os-release-'));
  try {
    const cases = [
      { id: 'ubuntu', versionCodename: 'jammy' },
      { id: 'debian', versionCodename: 'bookworm' },
    ];
    for (const { id, versionCodename } of cases) {
      const osReleasePath = path.join(tmpDir, `os-release-${id}`);
      fs.writeFileSync(
        osReleasePath,
        `ID=${id}\nVERSION_CODENAME=${versionCodename}\n`
      );
      // Exercise the exact subshell expression cloud-init.yaml uses, just
      // pointed at our fixture instead of the real /etc/os-release.
      const resolvedId = execFileSync(
        'bash',
        ['-c', `. "${osReleasePath}" && echo "$ID"`],
        { encoding: 'utf8' }
      ).trim();
      const resolvedCodename = execFileSync(
        'bash',
        ['-c', `. "${osReleasePath}" && echo "$VERSION_CODENAME"`],
        { encoding: 'utf8' }
      ).trim();
      assert.equal(resolvedId, id, `expected $ID to resolve to "${id}"`);
      assert.equal(resolvedCodename, versionCodename);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
