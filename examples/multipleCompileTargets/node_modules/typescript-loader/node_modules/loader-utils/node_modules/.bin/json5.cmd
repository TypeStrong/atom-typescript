@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\json5\lib\cli.js" %*
) ELSE (
  node  "%~dp0\..\json5\lib\cli.js" %*
)