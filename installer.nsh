CreateDirectory "$SMPROGRAMS\webpage_accessor"

CreateShortcut "$SMPROGRAMS\webpage_accessor\webpage_accessor.lnk" "$INSTDIR\webpage_accessor.exe"

CreateShortcut "$SMPROGRAMS\webpage_accessor\webpage_accessor (Clear configurations).lnk" \
"$INSTDIR\webpage_accessor.exe" "--clear-conf"