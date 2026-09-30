import os, re, base64, json
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

def rd(p): return open(p, encoding='utf-8').read()
def wr(p, s): open(p, 'w', encoding='utf-8').write(s)
def patch(p, pairs):
    s = rd(p)
    for a, b in pairs:
        if b in s and a not in s:
            continue
        assert a in s, (p, a[:70])
        s = s.replace(a, b)
    wr(p, s)

def datauri(path, mime):
    return 'data:%s;base64,%s' % (mime, base64.b64encode(open(path, 'rb').read()).decode())

# ---- build the single file ----
html = rd('index.html')
css = rd('css/style.css').replace("url('../fonts/PressStart2P-Regular.ttf')", "url('%s')" % datauri('fonts/PressStart2P-Regular.ttf', 'font/ttf'))
assets = {}
for f in sorted(os.listdir('assets')):
    if f.endswith('.png') and not f.startswith('sheet_source'):
        assets['assets/' + f] = datauri('assets/' + f, 'image/png')
    elif f.endswith('.ico'):
        assets['assets/' + f] = datauri('assets/' + f, 'image/x-icon')

html = re.sub(r'<link rel="stylesheet" href="css/style.css">', lambda m: '<style>\n' + css + '\n</style>', html)
html = re.sub(r'<link rel="icon"[^>]*href="assets/icon\.ico"[^>]*>', '<link rel="icon" href="%s" sizes="any">' % assets['assets/icon.ico'], html)
html = re.sub(r'<link rel="icon"[^>]*href="assets/icon-192\.png"[^>]*>', '<link rel="icon" type="image/png" sizes="192x192" href="%s">' % assets['assets/icon-192.png'], html)
html = re.sub(r'<link rel="icon"[^>]*href="assets/icon-512\.png"[^>]*>', '<link rel="icon" type="image/png" sizes="512x512" href="%s">' % assets['assets/icon-512.png'], html)
html = re.sub(r'<link rel="apple-touch-icon"[^>]*>', '<link rel="apple-touch-icon" href="%s">' % assets['assets/icon-192.png'], html)
html = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; media-src data: blob:; connect-src \'none\'">', html)

def inline_script(m):
    src = m.group(1)
    js = rd(src).replace('</script>', '<\\/script>')
    return '<script>\n' + js + '\n</script>'

head_assets = '<script>window.HVA_ASSETS = ' + json.dumps(assets) + ';</script>'
html = html.replace('<script src="js/data.js"></script>', head_assets + '\n<script src="js/data.js"></script>')
html = re.sub(r'<script src="(js/[^"]+)"></script>', inline_script, html)
out = os.path.join(os.path.dirname(ROOT), 'HumansVsAliens-Mobile.html')
wr(out, html)
print(out, round(os.path.getsize(out) / 1e6, 2), 'MB')
