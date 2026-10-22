@echo off
setlocal
cd /d "%~dp0"
echo ==========================================
echo       DUNAMIS - Sistema de Proyectos
echo ==========================================
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: No se encontro Node.js.
  echo Instale la version LTS desde https://nodejs.org/ y vuelva a ejecutar este archivo.
  pause
  exit /b 1
)
if not exist "node_modules\express" (
  echo Instalando dependencias del proyecto. Esto requiere conexion a Internet...
  call npm install
  if errorlevel 1 (
    echo ERROR: No se pudieron instalar las dependencias.
    pause
    exit /b 1
  )
)
echo Iniciando servidor...
echo Cuando aparezca el mensaje de servidor activo, abra http://localhost:3001
call npm start
pause
