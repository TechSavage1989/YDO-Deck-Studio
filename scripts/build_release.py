#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, os, re, shutil, subprocess, sys, zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
VERSION_RE=re.compile(r'AppVersion\s*=\s*"([^"]+)"')
APP_ID='com.techsavage1989.ygo-deck-studio'
EXECUTABLE_NAME='YGODeckStudio.exe'

def run(*args,env=None):
    print('+',' '.join(map(str,args)),flush=True)
    subprocess.run([str(a) for a in args],cwd=ROOT,env=env,check=True)

def sha256(path:Path)->str:
    h=hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return h.hexdigest()

def version()->str:
    m=VERSION_RE.search((ROOT/'launcher/version.go').read_text())
    if not m: raise SystemExit('Could not read AppVersion from launcher/version.go')
    return m.group(1)

def notes()->list[str]:
    rc=version().rsplit('rc',1)[-1]
    p=ROOT/f'CHANGELOG_rc{rc}.txt'
    if not p.exists(): return []
    out=[]
    for line in p.read_text(encoding='utf-8').splitlines():
        s=line.strip()
        if s.startswith('- '): out.append(s[2:].strip())
    return out[:6]

def zip_tree(src:Path,out:Path,root_name:str,exclude=()):
    exclude={str(Path(x)).replace('\\','/') for x in exclude}
    with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        z.writestr(root_name.rstrip('/')+'/',b'')
        for p in sorted(src.rglob('*')):
            if not p.is_file() or '__pycache__' in p.parts: continue
            rel=p.relative_to(src).as_posix()
            if rel in exclude or any(rel.startswith(x.rstrip('/')+'/') for x in exclude): continue
            z.write(p,f'{root_name}/{rel}')

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--out',type=Path,default=ROOT/'dist');ap.add_argument('--skip-tests',action='store_true');args=ap.parse_args()
    v=version(); rc=v.rsplit('rc',1)[-1]; out=args.out.resolve(); shutil.rmtree(out,ignore_errors=True);out.mkdir(parents=True)
    core=ROOT/'launcher/payload/YGODeckStudioCore.exe';core.parent.mkdir(parents=True,exist_ok=True)
    run(sys.executable,ROOT/'tools/patch_embedded_web.py',ROOT/'base/YGO_Deck_Studio_3_v3.0.0-alpha.221-duelcore.1-rc189_Base.exe',ROOT/'web',core)
    if not args.skip_tests:
        run('node','--check',ROOT/'web/js/app.js');run('node','--check',ROOT/'web/js/duel-core.js')
        run('go','test','./launcher/updater')
        for t in ['tests/test_rc236_update_client_timers.py','tests/test_rc238_update_banner_clicks.py','tests/test_rc235_named_identity_legality_explanations.py','tests/test_rc234_shared_extra_monster_zones.py','tests/test_rc233_xyz_material_and_final_chain.py','tests/test_rc232_visual_log_click_routing.py','tests/test_rc230_exact_material_autosubmit.py']:
            run(sys.executable,ROOT/t)
    asset_name=EXECUTABLE_NAME;exe=out/asset_name
    env=os.environ.copy();env.update({'GOOS':'windows','GOARCH':'amd64','CGO_ENABLED':'0'})
    run('go','build','-trimpath','-ldflags=-H windowsgui','-o',exe,'./launcher',env=env)
    run(sys.executable,ROOT/'tools/validate_windows_icon.py',exe,ROOT/'web/assets/app_icon.ico')
    if not args.skip_tests:
        env2=os.environ.copy();env2['YGO_TEST_CANDIDATE']=str(exe);run('go','test','./launcher/updater','-run','TestDownloadAndValidateBuiltCandidate|TestWrongIdentityCandidateRejected','-v',env=env2)
    size=exe.stat().st_size; digest=sha256(exe)
    manifest={'schema':1,'app_id':APP_ID,'version':v,'tag':'v'+v,'asset_name':asset_name,'sha256':digest,'size':size,'notes':notes()[:3]}
    (out/'update-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    portable=out/f'YGO_Deck_Studio_3_v{v}_Portable_Chat.zip'
    with zipfile.ZipFile(portable,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        z.writestr('YGO Deck Studio 3/',b'')
        z.writestr('YGO Deck Studio 3/'+EXECUTABLE_NAME,exe.read_bytes())
        for name in ['USER_MANUAL.txt','LEGAL_NOTICE.txt']:
            z.writestr('YGO Deck Studio 3/'+name,(ROOT/'docs'/name).read_bytes())
    with zipfile.ZipFile(portable) as z:
        if z.testzip() is not None or z.read('YGO Deck Studio 3/'+EXECUTABLE_NAME)!=exe.read_bytes():
            raise SystemExit('Portable package integrity validation failed')
    source=out/f'YGO_Deck_Studio_3_v{v}_Source_Chat.zip';zip_tree(ROOT,source,f'YGO_Deck_Studio_3_v{v}_Source',exclude={'launcher/payload/YGODeckStudioCore.exe','dist','.git','.pytest_cache','tests/__pycache__','launcher/updater/__pycache__'})
    with zipfile.ZipFile(source) as z:
        if z.testzip() is not None: raise SystemExit('Source package CRC validation failed')
    validation=ROOT/f'DUELCORE_VALIDATION_alpha221_duelcore1_rc{rc}.txt'
    if validation.exists(): shutil.copy2(validation,out/validation.name)
    sums=[]
    for p in [exe,portable,source,out/'update-manifest.json']+([out/validation.name] if validation.exists() else []): sums.append(f'{sha256(p)}  {p.name}')
    checksum=out/f'CHECKSUMS_SHA256_alpha221_duelcore1_rc{rc}.txt';checksum.write_text('\n'.join(sums)+'\n')
    print(f'Built {v} in {out}')
    for p in sorted(out.iterdir()): print(f'  {p.name}  {p.stat().st_size} bytes')
if __name__=='__main__': main()
