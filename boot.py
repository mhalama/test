import network

with open("wifi") as f:
    ssid = f.read()
    pwd = f.read()

wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(ssid, pwd)
