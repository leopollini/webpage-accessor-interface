osslsigncode sign -pkcs12 $CERT_LOCATION \
    -pass $CERT_KEY_PASSWORD \
    -n "Webpage Accessor" \
    -t http://timestamp.digicert.com \
    -in webpage_accessor\ Setup\ 0.0.77.exe \
    -out signed_output.exe