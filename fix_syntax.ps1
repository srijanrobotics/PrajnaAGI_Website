$filePath = 'c:\Users\Dell\Downloads\PrajnaAGI_Website\Index.html'
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# Fix the syntax error (extra closing brace at line 1230)
# We search for the specific pattern around the backToTop logic
$oldPattern = 'backToTopBtn\.addEventListener\(''click'', \(\) => \{\s+window\.scrollTo\(\{ top: 0, behavior: ''smooth'' \}\);\s+\}\);\s+\}\s+\}'
$newPattern = 'backToTopBtn.addEventListener(''click'', () => {
                window.scrollTo({ top: 0, behavior: ''smooth'' });
            });
        }'

# If the exact match fails due to whitespace, let's use a more robust regex
$regex = 'backToTopBtn\.addEventListener\(''click'', \(\) => \{\s+window\.scrollTo\(\{ top: 0, behavior: ''smooth'' \}\);\s+\}\);\s+\}\s+\}'
if ($content -match $regex) {
    $content = [regex]::Replace($content, $regex, 'backToTopBtn.addEventListener(''click'', () => {
                window.scrollTo({ top: 0, behavior: ''smooth'' });
            });
        }')
    Write-Host "Fixed extra brace in Index.html"
} else {
    Write-Host "Could not find the exact pattern for the extra brace. Trying a simpler replacement."
    # Fallback: find the double brace before </script>
    $content = $content -replace '}\s+}\s+</script>', '        }
    </script>'
}

# Also fix the admin branch in config.yml while we are at it
$configPath = 'c:\Users\Dell\Downloads\PrajnaAGI_Website\admin\config.yml'
if (Test-Path $configPath) {
    $configContent = [System.IO.File]::ReadAllText($configPath, [System.Text.Encoding]::UTF8)
    $configContent = $configContent -replace 'branch: main', 'branch: master'
    [System.IO.File]::WriteAllText($configPath, $configContent, [System.Text.Encoding]::UTF8)
    Write-Host "Updated admin/config.yml branch to master"
}

# Save Index.html back
[System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
Write-Host "Saved Index.html"
