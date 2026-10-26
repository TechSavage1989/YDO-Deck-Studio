"""Reject unplanned tracked root entries; also works in extracted Source ZIPs."""
from pathlib import Path
import subprocess
ROOT = Path(__file__).resolve().parents[1]
ALLOWED = ['.github', '.gitignore', 'AGENTS.md', 'BUILD_RC241.cmd', 'DEVELOPMENT_HANDOFF.md', 'README.md', 'base', 'docs', 'go.mod', 'launcher', 'requirements-dev.txt', 'scripts', 'tests', 'tools', 'web']
GENERATED = {'.git', 'dist', 'node_modules', 'test-artifacts', '__pycache__', '.pytest_cache'}
def check():
    if (ROOT / '.git').exists():
        paths = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard'], cwd=ROOT, text=True).splitlines()
        names = {p.split('/')[0] for p in paths}
    else:
        names = {p.name for p in ROOT.iterdir()} - GENERATED
    unexpected = names - set(ALLOWED)
    missing = set(ALLOWED) - names
    if unexpected or missing:
        raise SystemExit('Repository layout mismatch: unexpected=' + str(sorted(unexpected)) + '; missing=' + str(sorted(missing)))
    print('Repository layout OK (' + str(len(ALLOWED)) + ' root entries).')
if __name__ == '__main__':
    check()
