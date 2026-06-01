$excludeDirs = @(".git", "node_modules", ".next")
$extensions = @(".tsx", ".ts", ".js", ".json", ".md", ".css", ".html", ".sql", ".yml", ".env", ".env.local")

function Get-TextFiles($path) {
    $files = @()
    foreach ($item in Get-ChildItem -Path $path) {
        if ($item.PSIsContainer) {
            if ($excludeDirs -notcontains $item.Name) {
                $files += Get-TextFiles -path $item.FullName
            }
        } else {
            $ext = [System.IO.Path]::GetExtension($item.Name)
            if ($extensions -contains $ext -or $extensions -contains $item.Name) {
                $files += $item
            }
        }
    }
    return $files
}

$allFiles = Get-TextFiles -path "."

$replacements = @(
    @("SnapLead", "Basepound")
    @("snaplead", "basepound")
    @("SNAPLEAD", "BASEPOUND")
    @("Snaplead", "Basepound")
    @("Snap Lead", "Basepound")
    @("BasePond", "Basepound")
    @("basepond", "basepound")
    @("BASEPOND", "BASEPOUND")
    @("Base Pond", "Basepound")
)

foreach ($f in $allFiles) {
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
