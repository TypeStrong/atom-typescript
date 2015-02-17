@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\mime\cli.js" %*
) ELSE (
  node  "%~dp0\..\mime\cli.js" %*
)