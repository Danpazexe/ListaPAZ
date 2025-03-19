@echo off
setlocal enabledelayedexpansion

echo ===== INICIANDO PROCESSO DE GERACAO DE APK =====
echo Verificando ambiente...

:: Verificar se o Node.js está instalado
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo X Node.js nao encontrado. Por favor, instale o Node.js.
    exit /b 1
)

:: Verificar se o JDK está instalado
where javac >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo X JDK nao encontrado. Por favor, instale o JDK.
    exit /b 1
)

:: Verificar se o Android SDK está configurado
if "%ANDROID_HOME%"=="" (
    echo ! Variavel ANDROID_HOME nao configurada. Tentando localizar o Android SDK...
    
    :: Tentar encontrar o SDK em locais comuns
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
        echo ✓ Android SDK encontrado em !ANDROID_HOME!
    ) else if exist "%USERPROFILE%\AppData\Local\Android\Sdk" (
        set "ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk"
        echo ✓ Android SDK encontrado em !ANDROID_HOME!
    ) else (
        echo X Android SDK nao encontrado. Configure a variavel ANDROID_HOME.
        exit /b 1
    )
)

echo ✓ Ambiente verificado com sucesso!
echo.

echo ===== PREPARANDO O PROJETO =====

:: Instalar dependências
echo Instalando dependencias do projeto...
call npm install
echo ✓ Dependencias instaladas com sucesso!
echo.

:: Limpar cache
echo Limpando cache do Metro e do React Native...
call npx react-native clean-project-auto
echo ✓ Cache limpo com sucesso!
echo.

:: Remover diretórios nativos existentes
echo Removendo diretorios nativos existentes (se houver)...
if exist android rmdir /s /q android
if exist ios rmdir /s /q ios
echo ✓ Diretorios removidos com sucesso!
echo.

:: Gerar arquivos nativos do Android
echo Gerando arquivos nativos do Android...
call npx expo prebuild --platform android
echo ✓ Arquivos nativos gerados com sucesso!
echo.

:: Verificar problemas
echo Verificando possiveis problemas com o Expo Doctor...
call npx expo-doctor
echo ✓ Verificacao concluida!
echo.

:: Construir o APK
echo ===== CONSTRUINDO O APK =====
echo Navegando para a pasta Android e iniciando o build...
cd android && call gradlew.bat assembleRelease
set build_result=%ERRORLEVEL%

if %build_result% equ 0 (
    set "apk_path=%CD%\app\build\outputs\apk\release\app-release.apk"
    
    echo.
    echo ### BUILD CONCLUIDO COM SUCESSO! ###
    echo APK gerado em: !apk_path!
    echo.
    echo Para instalar o APK em um dispositivo conectado, execute:
    echo adb install -r "!apk_path!"
) else (
    echo.
    echo X FALHA NA CONSTRUCAO DO APK
    echo Verifique os erros acima para solucionar o problema.
    exit /b 1
)

:: Voltar para o diretório raiz
cd ..

echo.
echo ===== PROCESSO FINALIZADO ===== 