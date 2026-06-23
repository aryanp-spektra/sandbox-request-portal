<#
  Seed generator (PowerShell port of build_seed.py) for the Sandbox Portal.

  Reads the FY27 lab catalogue .xlsx by unzipping it and parsing the OpenXML
  directly (no Excel / Python / Node required), normalizes it, maps catalogue
  status onto the PRD lifecycle, synthesizes the lifecycle metadata the portal
  needs, and writes src/data/labs.json + src/data/meta.json.

  Deterministic: a stable SHA-256 of each lab id seeds the synthesized values.
#>
$ErrorActionPreference = 'Stop'

$Root  = Split-Path -Parent $PSScriptRoot
$Src   = Join-Path $Root 'External-PostBuild2026_GL_Catalog_FY27_v2.xlsx'
$Out   = Join-Path $Root 'src\data\labs.json'
$Sheet = 'Lab Catalog FY27'
$Today = [datetime]'2026-06-23'

# ---- normalization maps ----------------------------------------------------
$SOLUTION_AREA = @{
  'AI Business Solutions' = 'AI Business Solutions'
  'AI Business Process'   = 'AI Business Solutions'
  'AI Workforce'          = 'AI Business Solutions'
  'Cloud & AI Platforms'  = 'Cloud & AI Platforms'
  'Cloud and AI Platform' = 'Cloud & AI Platforms'
  'Security'              = 'Security'
}
$TYPE = @{
  'Guided Lab'       = @('guided-lab','Guided Lab')
  'GPS Skilling'     = @('gps-skilling','GPS Skilling')
  'Standard Sandbox' = @('standard-sandbox','Standard Sandbox')
  'Hack in a Day'    = @('hiad','Hack in a Day')
  'Hack to Skill'    = @('hack-to-skill','Hack to Skill')
  'Hack to Build'    = @('hack-to-build','Hack to Build')
}
$STATUS = @{
  'Available'                 = 'Available'
  'In Pipeline'               = 'In Pipeline'
  'In-Pipeline'               = 'In Pipeline'
  'In Pipeline (Enhancement)' = 'In Pipeline (Enhancement)'
  'Archive Now'               = 'Archive Now'
  'Archive Q1 FY27'           = 'Archive Q1 FY27'
}

# interest hooks, keyword-driven, first match wins, no em dashes
$HOOK_RULES = @(
  @{ k = @('copilot for sales','copilot for sale','dynamic copilot for sales'); v = 'Close deals faster with AI that lives right inside your CRM and inbox.' }
  @{ k = @('m365 copilot','microsoft 365 copilot','copilot for m365'); v = 'Put Microsoft 365 Copilot to work across Word, Excel, Teams and Outlook.' }
  @{ k = @('copilot studio','leave management','store operations','agent'); v = 'Design and ship your own AI agents with Copilot Studio, no heavy code needed.' }
  @{ k = @('rag','chatbot','ai search','langchain','knowledge'); v = 'Ground a chatbot in your own data and take it all the way to production.' }
  @{ k = @('openai','generative ai','dall-e','prompt'); v = 'Go hands-on with Azure OpenAI, from prompt engineering to responsible AI.' }
  @{ k = @('fabric','lakehouse','real-time intelligence','delta lake','eventhouse'); v = 'Turn raw data into real-time insight with Microsoft Fabric.' }
  @{ k = @('databricks','spark'); v = 'Engineer and analyze data at scale on Azure Databricks.' }
  @{ k = @('defender for endpoint','edr'); v = 'Hunt, investigate and shut down endpoint attacks like a real SOC analyst.' }
  @{ k = @('defender for cloud','posture','cspm'); v = 'Lock down cloud workloads and fix risks before attackers ever find them.' }
  @{ k = @('sentinel','secops','365 defender','defender suite','xdr'); v = "Run modern security operations across Microsoft's unified defense stack." }
  @{ k = @('purview','data security','sensitivity label','compliance'); v = 'Discover, classify and protect sensitive data right across your estate.' }
  @{ k = @('kubernetes','aks','cloud native','container','docker'); v = 'Containerize, deploy and scale a cloud-native app on Kubernetes.' }
  @{ k = @('landing zone','alz','caf'); v = 'Stand up an enterprise-ready Azure foundation the right way.' }
  @{ k = @('migrat','modernization','modernize','site recovery','hyper-v'); v = 'Move real workloads to Azure with a proven, end-to-end migration playbook.' }
  @{ k = @('virtual machine','compute','availability set','iis'); v = 'Master core Azure compute, networking and recovery from the ground up.' }
  @{ k = @('app in a day','power apps','power platform','low code','canvas app','dataverse'); v = 'Build a working business app fast on the Power Platform.' }
  @{ k = @('power bi','analyst in a day','faiad','dataflow'); v = 'Go from raw tables to polished, refreshable reports in a single day.' }
  @{ k = @('document','ocr','invoice','form processing'); v = 'Automate document-heavy busywork with Azure AI.' }
  @{ k = @('cosmos'); v = 'Build globally distributed, low-latency apps on Cosmos DB.' }
  @{ k = @('synapse'); v = 'Unify big-data and analytics workloads with Azure Synapse.' }
  @{ k = @('devops','github','ci/cd','pipeline'); v = 'Ship faster with secure, automated DevOps pipelines.' }
  @{ k = @('marketing'); v = 'Let AI take the busywork out of campaigns and content.' }
)
$AREA_FALLBACK = @{
  'AI Business Solutions' = 'Apply Microsoft AI to a real business scenario, start to finish.'
  'Cloud & AI Platforms'  = 'Get hands-on with the Azure platform on a real-world build.'
  'Security'              = "Defend a live environment using Microsoft's security stack."
}

# ---- helpers ---------------------------------------------------------------
$sha = [System.Security.Cryptography.SHA256]::Create()
function HashBig([string]$s) {
  $bytes = $sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($s))
  $hex = -join ($bytes | ForEach-Object { $_.ToString('x2') })
  return [System.Numerics.BigInteger]::Parse('0' + $hex, [System.Globalization.NumberStyles]::HexNumber)
}
function HMod($big, [int]$m) { return [int]($big % $m) }

function Slugify([string]$s) {
  $s = [regex]::Replace($s, '(?i)\[NEW\]', '')
  $s = $s.ToLower()
  $s = [regex]::Replace($s, '[^a-z0-9]+', '-').Trim('-')
  if ($s.Length -gt 60) { $s = $s.Substring(0, 60) }
  return $s
}
function SplitList($cell, [switch]$Modules) {
  if ($null -eq $cell) { return @() }
  $txt = [string]$cell
  if ($txt.Trim() -eq '') { return @() }
  if ($Modules) {
    $out = @()
    foreach ($p in [regex]::Split($txt, '[\r\n]+')) {
      $p = [regex]::Replace($p, '^\s*\d+[\.\)]\s*', '').Trim()
      if ($p -ne '') { $out += $p }
    }
    return $out
  }
  return @($txt.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
}
function MakeHook([string]$title, $products, $skill, $area) {
  $hay = (@($title, $skill, ($products -join ' ')) -join ' ').ToLower()
  foreach ($rule in $HOOK_RULES) {
    foreach ($key in $rule.k) { if ($hay.Contains($key)) { return $rule.v } }
  }
  if ($AREA_FALLBACK.ContainsKey($area)) { return $AREA_FALLBACK[$area] }
  return 'Build practical, job-ready skills on Microsoft Cloud.'
}
function LifecycleFor([string]$status, $big) {
  switch ($status) {
    'Available'                 { if ((HMod $big 10) -lt 3) { return @('InUse', $true) } else { return @('Ready', $true) } }
    'In Pipeline (Enhancement)' { return @('Stale', $true) }
    'In Pipeline'               { return @('InTesting', $false) }
    'Archive Now'               { return @('Retired', $false) }
    'Archive Q1 FY27'           { return @('Retired', $false) }
    default                     { return @('Ready', $true) }
  }
}

# ---- read xlsx -------------------------------------------------------------
$tmp = Join-Path $env:TEMP ('xlsx_seed_' + [guid]::NewGuid().ToString('N'))
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($Src, $tmp)
try {
  [xml]$wbXml = Get-Content (Join-Path $tmp 'xl\workbook.xml')
  $rid = ($wbXml.workbook.sheets.sheet | Where-Object { $_.name -eq $Sheet }).id
  [xml]$relsXml = Get-Content (Join-Path $tmp 'xl\_rels\workbook.xml.rels')
  $target = ($relsXml.Relationships.Relationship | Where-Object { $_.Id -eq $rid }).Target
  $sheetPath = Join-Path $tmp ('xl\' + ($target -replace '/', '\'))

  $sst = New-Object System.Collections.Generic.List[string]
  $sstPath = Join-Path $tmp 'xl\sharedStrings.xml'
  if (Test-Path $sstPath) {
    [xml]$sstXml = Get-Content $sstPath
    foreach ($si in $sstXml.sst.si) { $sst.Add([string]$si.InnerText) }
  }

  function ColIndex([string]$ref) {
    $c = [regex]::Match($ref, '^([A-Z]+)').Groups[1].Value
    $n = 0
    foreach ($ch in $c.ToCharArray()) { $n = $n * 26 + ([int][char]$ch - 64) }
    return $n - 1
  }

  [xml]$sheetXml = Get-Content $sheetPath
  $rows = New-Object System.Collections.Generic.List[object]
  foreach ($row in $sheetXml.worksheet.sheetData.row) {
    $cells = @{}
    $max = -1
    foreach ($c in $row.c) {
      $idx = ColIndex $c.r
      $val = $null
      if ($c.t -eq 's') { $val = $sst[[int]$c.v] }
      elseif ($c.t -eq 'inlineStr') { $val = [string]$c.is.InnerText }
      elseif ($null -ne $c.v) { $val = [string]$c.v }
      $cells[$idx] = $val
      if ($idx -gt $max) { $max = $idx }
    }
    $arr = New-Object object[] ($max + 1)
    for ($i = 0; $i -le $max; $i++) { if ($cells.ContainsKey($i)) { $arr[$i] = $cells[$i] } }
    $rows.Add($arr)
  }

  # locate header row + column map (header column names vary between catalogue
  # versions, so resolve logical names against a candidate / prefix list)
  $hi = -1
  for ($i = 0; $i -lt $rows.Count; $i++) {
    $vals = @($rows[$i] | ForEach-Object { if ($_ -ne $null) { ([string]$_).Trim() } else { '' } })
    if (($vals -contains 'Lab Title') -and ($vals -contains 'Lab Catalog')) { $hi = $i; break }
  }
  if ($hi -lt 0) { throw "Header row with 'Lab Title' not found" }
  $hdr = @($rows[$hi] | ForEach-Object { if ($_ -ne $null) { ([string]$_).Trim() } else { '' } })
  $col = @{}
  for ($i = 0; $i -lt $hdr.Count; $i++) { if ($hdr[$i] -ne '' -and -not $col.ContainsKey($hdr[$i])) { $col[$hdr[$i]] = $i } }

  # logical name -> ordered candidate header names (exact first, then prefix)
  $ALIAS = @{
    'Solution Area'                          = @('Solution Area (FY27)', 'Solution Area')
    'Skill Area'                             = @('Skill Area (FY27)2', 'Skill Area (FY27)', 'Skill Area')
    'Level (in GPS Catalog format)'          = @('Level (in GPS Catalog format)', 'Level')
    'Featured Product (in GPS Catalog format)' = @('Featured Product (in GPS Catalog format)', 'Featured Product')
    'Course Overview (in GPS Catalog format)' = @('Course Overview (in GPS Catalog format)', 'Course Overview')
  }
  function ResolveCol([string]$name) {
    $cands = if ($ALIAS.ContainsKey($name)) { $ALIAS[$name] } else { @($name) }
    foreach ($c in $cands) { if ($col.ContainsKey($c)) { return $col[$c] } }
    foreach ($c in $cands) { foreach ($k in $col.Keys) { if ($k.StartsWith($c)) { return $col[$k] } } }
    return -1
  }
  function G($r, [string]$name) {
    $i = ResolveCol $name
    if ($i -ge 0 -and $i -lt $r.Count) { return $r[$i] }
    return $null
  }

  $partnerPool = @('WaferWire LLC','Contoso','Fabrikam','Northwind','Adventure Works','Tailspin','Proseware')
  $seen = @{}
  $labs = New-Object System.Collections.Generic.List[object]

  for ($ri = $hi + 1; $ri -lt $rows.Count; $ri++) {
    $r = $rows[$ri]
    $title = G $r 'Lab Title'
    if ($null -eq $title -or ([string]$title).Trim() -eq '') { continue }
    $title = [regex]::Replace(([string]$title), '\s+', ' ').Trim()
    $title = [regex]::Replace($title, '\s+[–—]\s+', ': ')
    $title = $title.Replace([char]0x2014, '-').Replace([char]0x2013, '-')
    # a "[NEW]" tag drives the isNew badge, so lift it out of the display title
    $isNew = $title.ToLower().Contains('[new]')
    $title = [regex]::Replace($title, '\s*\[NEW\]\s*', ' ', 'IgnoreCase').Trim()

    $rawType = ([string](G $r 'Lab Catalog')).Trim()
    if (-not $TYPE.ContainsKey($rawType)) { continue }
    $typeId = $TYPE[$rawType][0]; $typeLabel = $TYPE[$rawType][1]

    $base = Slugify $title; if ($base -eq '') { $base = 'lab' }
    $labId = "$typeId-$base"; $n = 2
    while ($seen.ContainsKey($labId)) { $labId = "$typeId-$base-$n"; $n++ }
    $seen[$labId] = $true

    $big = HashBig $labId
    $rawStatus = ([string](G $r 'Status')).Trim(); if ($rawStatus -eq '') { $rawStatus = 'Available' }
    $labStatus = if ($STATUS.ContainsKey($rawStatus)) { $STATUS[$rawStatus] } else { 'Available' }
    $lc = LifecycleFor $labStatus $big
    $lifecycle = $lc[0]; $requestable = $lc[1]

    $saRaw = ([string](G $r 'Solution Area')).Trim()
    $sa = if ($SOLUTION_AREA.ContainsKey($saRaw)) { $SOLUTION_AREA[$saRaw] } else { 'Other' }
    $level = ([string](G $r 'Level (in GPS Catalog format)')).Trim()
    if ($level -notin @('Beginner','Intermediate','Advanced')) { $level = $null }

    if ($lifecycle -in @('Ready','InUse')) { $daysAgo = 5 + (HMod $big 40) } else { $daysAgo = 90 + (HMod $big 120) }
    $lastRefresh = if ($lifecycle -ne 'InTesting') { $Today.AddDays(-$daysAgo).ToString('yyyy-MM-dd') } else { $null }
    $issued = if ($lifecycle -in @('InTesting','Retired')) { 0 } else { 20 + (HMod $big 380) }
    $redeemed = [int]($issued * (0.4 + (HMod $big 50) / 100.0))
    $lastRedeemed = if ($redeemed -gt 0) { $Today.AddDays(-(HMod $big 30)).ToString('yyyy-MM-dd') } else { $null }
    $npart = if ($lifecycle -in @('InTesting','Retired')) { 0 } else { 1 + (HMod $big 3) }
    $partners = @()
    for ($i = 0; $i -lt $npart; $i++) { $partners += $partnerPool[(HMod $big 7 + $i) % 7] }
    $partners = @($partners | Sort-Object -Unique)

    $skill = ([string](G $r 'Skill Area')).Trim(); if ($skill -eq '') { $skill = $null }
    $prodCell = G $r 'Featured Product (in GPS Catalog format)'
    $prods = if (([string]$prodCell).Trim().ToUpper() -ne 'NA') { SplitList $prodCell } else { @() }

    $enhCell = G $r 'Post Build 2026 Enhancements'
    $enh = $null
    if ($null -ne $enhCell -and ([string]$enhCell).Trim().ToUpper() -notin @('NA','ARCHIVE','')) { $enh = ([string]$enhCell).Trim() }

    $preview = $null
    $previewCell = G $r 'Lab Guide'
    if ($null -ne $previewCell) {
      $p = ([string]$previewCell).Trim()
      if ($p -match '^https?://') { $preview = $p }
    }

    $lab = [ordered]@{
      id            = $labId
      title         = $title
      hook          = MakeHook $title $prods $skill $sa
      previewUrl    = $preview
      isNew         = $isNew
      type          = $typeId
      typeLabel     = $typeLabel
      solutionArea  = $sa
      skillArea     = $skill
      level         = $level
      overview      = ([string](G $r 'Course Overview (in GPS Catalog format)')).Trim()
      modules       = @(SplitList (G $r 'Lab Modules / Exercises') -Modules)
      products      = @($prods)
      enhancements  = $enh
      catalogStatus = $labStatus
      lifecycle     = $lifecycle
      requestable   = $requestable
      lastRefresh   = $lastRefresh
      vouchers      = [ordered]@{ issued = $issued; redeemed = $redeemed; lastRedeemed = $lastRedeemed }
      activePartners = @($partners)
    }
    $labs.Add($lab)
  }

  # ---- write outputs -------------------------------------------------------
  $json = $labs | ConvertTo-Json -Depth 8
  # ConvertTo-Json escapes these; restore for clean, readable output
  $json = $json -replace '\\u0026', '&' -replace '\\u003c', '<' -replace '\\u003e', '>' -replace '\\u0027', "'"
  [System.IO.File]::WriteAllText($Out, $json, (New-Object System.Text.UTF8Encoding($false)))

  $meta = [ordered]@{
    generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mmK')
    labCount    = $labs.Count
  }
  $metaPath = Join-Path (Split-Path $Out) 'meta.json'
  [System.IO.File]::WriteAllText($metaPath, ($meta | ConvertTo-Json), (New-Object System.Text.UTF8Encoding($false)))

  Write-Output "Wrote $($labs.Count) labs -> $Out"
  Write-Output ('lifecycle:    ' + (($labs | Group-Object { $_.lifecycle } | ForEach-Object { "$($_.Name)=$($_.Count)" }) -join ', '))
  Write-Output ('requestable:  ' + (($labs | Group-Object { $_.requestable } | ForEach-Object { "$($_.Name)=$($_.Count)" }) -join ', '))
  Write-Output ('type:         ' + (($labs | Group-Object { $_.typeLabel } | ForEach-Object { "$($_.Name)=$($_.Count)" }) -join ', '))
  Write-Output ('solutionArea: ' + (($labs | Group-Object { $_.solutionArea } | ForEach-Object { "$($_.Name)=$($_.Count)" }) -join ', '))
  Write-Output ('withPreview:  ' + (@($labs | Where-Object { $_.previewUrl }).Count))
}
finally {
  Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
}
