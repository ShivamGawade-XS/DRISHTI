import urllib.request
import json
import ssl
import time

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# We will use time.sleep to avoid 429
files = {
    'paytm': 'File:Paytm_logo.svg',
    'phonepe': 'File:PhonePe_Logo.svg',
    'cred': 'File:CRED_logo.png', # Cred doesn't have an SVG on commons, let's use the PNG or maybe just a clearbit api
    'yes': 'File:YES_Bank_Logo.svg'
}

for name, filename in files.items():
    try:
        time.sleep(2) # avoid 429
        url = f'https://en.wikipedia.org/w/api.php?action=query&titles={filename}&prop=imageinfo&iiprop=url&format=json'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        resp = urllib.request.urlopen(req, context=ctx).read()
        data = json.loads(resp)
        pages = data['query']['pages']
        
        svg_url = None
        for page_id in pages:
            if 'imageinfo' in pages[page_id]:
                svg_url = pages[page_id]['imageinfo'][0]['url']
                
        if svg_url:
            print(f"Downloading {name} from {svg_url}...")
            svg_req = urllib.request.Request(svg_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
            svg_data = urllib.request.urlopen(svg_req, context=ctx).read()
            # If it's a PNG, we'll save it as PNG
            ext = 'png' if svg_url.endswith('.png') else 'svg'
            with open(f'frontend/public/logos/{name}.{ext}', 'wb') as f:
                f.write(svg_data)
            print(f"Success! {name}.{ext} saved.")
        else:
            print(f"Could not find URL for {name}")
    except Exception as e:
        print(f"Error on {name}: {e}")
