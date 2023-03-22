import network

with open("wifi") as f:
    ssid = f.readline().rstrip()
    pwd = f.readline().rstrip()

wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(ssid, pwd)

import mip
mip.install("http://192.168.15.189:5000/test/boot.py",target="/")
mip.install("http://192.168.15.189:5000/test/main.py",target="/")
# mip.install("github:mhalama/test/boot.py",target="/")
# mip.install("github:mhalama/test/main.py",target="/")
