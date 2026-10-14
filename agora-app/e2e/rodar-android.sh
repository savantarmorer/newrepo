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

# Emulador recém-ligado fica lento: espera assentar e fecha diálogos de sistema
sleep 20
adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS || true

# Fumaça: o app abre e continua vivo? (independente do Maestro)
set +x
adb shell monkey -p br.comunidade.agora -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
sleep 25
echo "::group::Fumaça — app aberto há 25 s"
if adb shell pidof br.comunidade.agora; then echo "APP RODANDO"; else echo "APP NÃO ESTÁ RODANDO (crash na abertura)"; fi
adb shell dumpsys activity activities | grep -E "topResumedActivity" || true
grep -E -A6 "FATAL EXCEPTION|ReactNativeJS.*(Error|TypeError)" saida/logcat.txt | head -40 || true
echo "::endgroup::"
adb shell am force-stop br.comunidade.agora || true
set -x
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
  # mensagens de erro primeiro (sem as linhas "at ..." da pilha), depois o começo de cada pilha
  grep -E "ReactNativeJS|ReactNative|AndroidRuntime|FATAL|Exception|agora" logcat.txt | grep -vE "^\S+\s*\(\s*[0-9]+\):\s+at " | tail -80 || true
  grep -E -A6 "FATAL EXCEPTION|ReactNativeJS.*(Error|TypeError)" logcat.txt | head -60 || true
  echo "::endgroup::"
fi
exit $STATUS
