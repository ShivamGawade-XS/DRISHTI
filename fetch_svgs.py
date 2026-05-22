import urllib.request
import re

urls = {
    'axis': 'https://commons.wikimedia.org/wiki/File:Axis_Bank_logo.svg',
    'kotak': 'https://commons.wikimedia.org/wiki/File:Kotak_Mahindra_Bank_logo.svg',
    'cred': 'https://commons.wikimedia.org/wiki/File:Cred_logo.svg',
    'yes': 'https://commons.wikimedia.org/wiki/File:YES_Bank_Logo.svg'
}

req_headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

for name, url in urls.items():
    try:
        req = urllib.request.Request(url, headers=req_headers)
        html = urllib.request.urlopen(req).read().decode('utf-8')
        match = re.search(r'href=\"(https://upload.wikimedia.org/wikipedia/commons/[^\"]+\.svg)\"', html)
        if match:
            svg_url = match.group(1)
            print(f"{name}: Found {svg_url}")
            
            # Download it
            svg_req = urllib.request.Request(svg_url, headers=req_headers)
            svg_data = urllib.request.urlopen(svg_req).read()
            with open(f"frontend/public/logos/{name}.svg", "wb") as f:
                f.write(svg_data)
            print(f"{name}: Downloaded {len(svg_data)} bytes")
        else:
            print(f"{name}: SVG link not found")
    except Exception as e:
        print(f"{name}: Error {e}")
