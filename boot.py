import network

with open("wifi") as f:
    ssid = f.readline().rstrip()
    pwd = f.readline().rstrip()

wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(ssid, pwd)
