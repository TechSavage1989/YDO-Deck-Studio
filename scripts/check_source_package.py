"""Rebuild the packaged complete source without repeating browser tests."""
from pathlib import Path
import subprocess
import sys
import tempfile
import zipfile
ROOT = Path(__file__).resolve().parents[1]
archive_path = next((ROOT / 'dist').glob('*_Source_Chat.zip'))
with tempfile.TemporaryDirectory() as temp:
    target = Path(temp)
    with zipfile.ZipFile(archive_path) as archive:
        assert archive.testzip() is None
        archive.extractall(target)
    source = next(target.iterdir())
    subprocess.run([sys.executable, str(source / 'scripts/check_layout.py')], check=True)
    subprocess.run([sys.executable, str(source / 'scripts/build_release.py'), '--skip-tests', '--out', str(target / 'rebuilt')], cwd=source, check=True)
print('Complete Source ZIP extracted and rebuilt; linked icon and portable integrity validated.')
