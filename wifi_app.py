import subprocess
from flask import Flask, request, jsonify,send_from_directory
import xml.etree.ElementTree as ET
import os

app = Flask(__name__)

def scan_networks():
    output = subprocess.check_output("netsh wlan show networks", shell=True).decode("utf-8", errors="ignore")
    networks = []
    ssid = None
    for line in output.splitlines():
        line = line.strip()
        if line.startswith("SSID") and not "BSSID" in line:
            ssid = line.split(":")[1].strip()
            if ssid:
                networks.append(ssid)
    return networks

def create_wifi_profile(ssid, password):
    xml_template = f"""<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
    <name>{ssid}</name>
    <SSIDConfig>
        <SSID>
            <name>{ssid}</name>
        </SSID>
    </SSIDConfig>
    <connectionType>ESS</connectionType>
    <connectionMode>auto</connectionMode>
    <MSM>
        <security>
            <authEncryption>
                <authentication>WPA2PSK</authentication>
                <encryption>AES</encryption>
                <useOneX>false</useOneX>
            </authEncryption>
            <sharedKey>
                <keyType>passPhrase</keyType>
                <protected>false</protected>
                <keyMaterial>{password}</keyMaterial>
            </sharedKey>
        </security>
    </MSM>
</WLANProfile>"""
    filename = f"{ssid}.xml"
    with open(filename, "w") as file:
        file.write(xml_template)
    return filename

@app.route("/api/networks")
def get_networks():
    return jsonify(scan_networks())
@app.route("/")
def index_tester():
    return send_from_directory('static','index.html')
@app.route("/api/connect", methods=["POST"])
def connect():
    data = request.json
    ssid = data.get("ssid")
    password = data.get("password")

    xml_file = create_wifi_profile(ssid, password)
    subprocess.run(f'netsh wlan add profile filename="{xml_file}"', shell=True)
    subprocess.run(f'netsh wlan connect name="{ssid}"', shell=True)
    
    return jsonify({"message": f"Connecting to {ssid}..."})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

