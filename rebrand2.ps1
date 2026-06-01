$extensions = @(".tsx", ".ts", ".js", ".json", ".md", ".css", ".html", ".sql", ".yml", ".env", ".env.local")

$files = Get-ChildItem -Path . -Recurse -File | Where-Object { 
    $ext = [System.IO.Path]::GetExtension($_.Name)
    ($extensions -contains $ext -or $extensions -contains $_.Name) -and
    $_.FullName -notmatch "\\node_modules\\" -and
    $_.FullName -notmatch "\\\.next\\" -and
    $_.FullName -notmatch "\\\.git\\"
}

$replacements = @(
    @("SnapLead", "Basepound"),
    @("snaplead", "basepound"),
    @("SNAPLEAD", "BASEPOUND"),
    @("Snaplead", "Basepound"),
    @("Snap Lead", "Basepound"),
    @("BasePond", "Basepound"),
    @("basepond", "basepound"),
    @("BASEPOND", "BASEPOUND"),
    @("Base Pond", "Basepound")
)

foreach ($f in $files) {
    $path = $f.FullName
    try {
        $content = [System.IO.File]::ReadAllText($path)
        $originalContent = $content
        
        foreach ($pair in $replacements) {
            $content = $content.Replace($pair[0], $pair[1])
        }
        
        if ($content -cne $originalContent) {
            [System.IO.File]::WriteAllText($path, $content)
            Write-Output "Updated $path"
        }
    } catch {
        Write-Warning "Could not process $path : $($_.Exception.Message)"
    }
}
