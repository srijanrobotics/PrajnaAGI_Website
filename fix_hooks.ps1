$filePath = 'c:\Users\Dell\Downloads\PrajnaAGI_Website\Index.html'
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# Add class hooks to featured card elements
$content = $content -replace '<span class="tag">⭐ Featured</span>', '<span class="tag featured-tag">⭐ Featured</span>'

# Save back
[System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
Write-Host "Done - class hooks applied"
