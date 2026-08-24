HOST_IP=$(grep nameserver /etc/resolv.conf | awk '{print $2}')
echo "Host IP is $HOST_IP"
curl -s "http://$HOST_IP:11434/api/tags" || curl -s "http://127.0.0.1:11434/api/tags"
