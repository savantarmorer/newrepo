#!/usr/bin/env bash
# Roda dentro do emulador do CI (reactivecircus/android-emulator-runner).
# Instala o APK, executa o fluxo Maestro e guarda capturas + logcat em e2e/saida/.
# Em caso de falha, imprime no log do job o que estava na tela e os erros do app.
set -euxo pipefail
cd "$(dirname "$0")"
mkdir -p saida
APK="${APK:-$(ls ../dist/*.apk | head -1)}"
adb install -r -g "$APK"
adb logcat -c || true
(adb logcat -v brief '*:W' ReactNativeJS:V ReactNative:V > saida/logcat.txt 2>&1 &) || true
cd saida
set +e
"$HOME/.maestro/bin/maestro" test \
  -e CHAVE="$SUPABASE_ANON_KEY" \
  -e URL_SERVIDOR="http%3A%2F%2F10.0.2.2%3A54321" \
  --format junit --output relatorio.xml \
  ../fluxo-principal.yaml
STATUS=$?
set +x
adb exec-out screencap -p > 99-final.png || true
if [ "$STATUS" -ne 0 ]; then
  echo "::group::Diagnóstico — app em execução?"
  adb shell pidof br.comunidade.agora || echo "PROCESSO DO APP NÃO ESTÁ RODANDO (provável crash)"
  adb shell dumpsys activity activities | grep -E "topResumedActivity|mResumedActivity" || true
  echo "::endgroup::"
  echo "::group::Diagnóstico — textos na tela"
  "$HOME/.maestro/bin/maestro" hierarchy 2>/dev/null \
    | grep -oE '"(text|accessibilityText|resource-id|hintText)" *: *"[^"]+"' | sort -u | head -120 || true
  echo "::endgroup::"
  echo "::group::Diagnóstico — logcat (erros e JS)"
  grep -E "ReactNativeJS|ReactNative|AndroidRuntime|FATAL|Exception|agora" logcat.txt | tail -200 || true
  echo "::endgroup::"
fi
exit $STATUS
