import subprocess
from flask import Flask, request, jsonify, send_from_directory
import os

app = Flask(__name__)

def scan_networks():
    try:
        output = subprocess.check_output(["nmcli", "-t", "-f", "SSID", "dev", "wifi"], stderr=subprocess.STDOUT)
        ssids = set()
        for line in output.decode().splitlines():
            line = line.strip()
            if line:
                ssids.add(line)
        return list(ssids)
    except subprocess.CalledProcessError as e:
        return {"error": e.output.decode()}

def connect_to_network(ssid, password):
    try:
        if password=="null":
            subprocess.run(["nmcli","dev","wifi","connect",ssid],check=True)
        else:

            subprocess.run(["nmcli", "dev", "wifi", "connect", ssid, "password", password], check=True)
        return {"message": f"Connected to {ssid}"}
    except subprocess.CalledProcessError as e:
        return {"error": e.output.decode()}

@app.route("/api/networks")
def get_networks():
    return jsonify(scan_networks())

@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/api/connect", methods=["POST"])
def connect():
    data = request.json
    ssid = data.get("ssid")
    password = data.get("password")

    result = connect_to_network(ssid, password)
    return jsonify(result)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
