#!/usr/bin/env bash
# Roda dentro do emulador do CI (reactivecircus/android-emulator-runner).
# Instala o APK, executa o fluxo Maestro e guarda capturas + logcat em e2e/saida/.
set -euxo pipefail
cd "$(dirname "$0")"
mkdir -p saida
APK="${APK:-$(ls ../dist/*.apk | head -1)}"
adb install -r -g "$APK"
adb logcat -c || true
(adb logcat '*:W' ReactNativeJS:V > saida/logcat.txt 2>&1 &) || true
cd saida
set +e
"$HOME/.maestro/bin/maestro" test \
  -e CHAVE="$SUPABASE_ANON_KEY" \
  -e URL_SERVIDOR="http%3A%2F%2F10.0.2.2%3A54321" \
  --format junit --output relatorio.xml \
  ../fluxo-principal.yaml
STATUS=$?
adb exec-out screencap -p > 99-final.png || true
exit $STATUS
