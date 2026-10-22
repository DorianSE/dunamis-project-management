@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: No se encontro Node.js.
  pause
  exit /b 1
)
echo Revisando sintaxis de los archivos principales...
node --check server.js || goto error
node --check db.js || goto error
node --check routes\users.js || goto error
node --check routes\roles.js || goto error
node --check routes\clientes.js || goto error
node --check routes\proyectos.js || goto error
node --check routes\ajustes.js || goto error
echo OK: no se detectaron errores de sintaxis en los archivos revisados.
pause
exit /b 0
:error
echo ERROR: revise el archivo indicado arriba.
pause
exit /b 1
