$ErrorActionPreference = "Stop"
$Raiz = Split-Path -Parent $PSScriptRoot

# Carrega variaveis de .env e .env.local na raiz (se existirem)
foreach ($arquivo in @("$Raiz\.env", "$Raiz\.env.local")) {
    if (Test-Path $arquivo) {
        Get-Content $arquivo | ForEach-Object {
            $linha = $_.Trim()
            if ($linha -and -not $linha.StartsWith("#") -and $linha.Contains("=")) {
                $chave, $valor = $linha -split "=", 2
                $chave = $chave.Trim()
                $valor = $valor.Trim().Trim('"').Trim("'")
                if ($chave -and -not [Environment]::GetEnvironmentVariable($chave)) {
                    [Environment]::SetEnvironmentVariable($chave, $valor, "Process")
                }
            }
        }
    }
}

# Garante JAVA_HOME apontando para JDK 21+ se nao estiver definido
if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    $jdk = Get-ChildItem "C:\Program Files\Java" -Directory -Filter "jdk-21*" -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending | Select-Object -First 1
    if ($jdk) {
        $env:JAVA_HOME = $jdk.FullName
    }
}

if ($env:JAVA_HOME) {
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
}

Push-Location $PSScriptRoot
try {
    & .\mvnw.cmd jetty:run
} finally {
    Pop-Location
}
