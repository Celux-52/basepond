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

foreach ($f in $allFiles) {
    $path = $f.FullName
    try {
        $content = [System.IO.File]::ReadAllText($path)
        $originalContent = $content
        
        $content = $content.Replace("SnapLead", "Basepound")
        $content = $content.Replace("snaplead", "basepound")
        $content = $content.Replace("SNAPLEAD", "BASEPOUND")
        $content = $content.Replace("Snaplead", "Basepound")
        $content = $content.Replace("Snap Lead", "Basepound")
        $content = $content.Replace("BasePond", "Basepound")
        $content = $content.Replace("basepond", "basepound")
        $content = $content.Replace("BASEPOND", "BASEPOUND")
        $content = $content.Replace("Base Pond", "Basepound")
        $content = $content.Replace("basePond", "Basepound")
        
        if ($content -cne $originalContent) {
            [System.IO.File]::WriteAllText($path, $content)
            Write-Output "Updated $path"
        }
    } catch {
        Write-Warning "Could not process $path : $($_.Exception.Message)"
    }
}
