import pyshark
from backend.detection.rules import analyze_dns

INTERFACE = "eth0"  # Change to your active network interface

def start_sniffing():
    capture = pyshark.LiveCapture(interface=INTERFACE, bpf_filter="udp port 53")
    print("[*] DNS Monitoring started...")

    for packet in capture.sniff_continuously():
        try:
            if 'DNS' in packet:
                dns = packet.dns
                if hasattr(dns, 'qry_name'):
                    domain = dns.qry_name.lower()
                    src_ip = packet.ip.src
                    print(f"[DNS] {src_ip} -> {domain}")
                    analyze_dns(domain, src_ip)
        except Exception as e:
            print(f"[ERROR] {e}")

if __name__ == "__main__":
    start_sniffing()
