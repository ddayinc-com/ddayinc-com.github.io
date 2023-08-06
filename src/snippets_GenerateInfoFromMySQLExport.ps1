<#  .Description
    Make new Record Detail objects from objects in YAML from MySQL export

    .Example
    snippets_GenerateInfoFromMySQLExport.ps1 | ConvertTo-Json | Out-File -Encoding ascii -FilePath recordsInfo.json
#>
#Requires -Modules powershell-yaml
param(
    ## Path to data input file
    [String]$Path = "$PSScriptRoot\data\challenge_data_as_obj.yaml"
)

process {
    $hshRecordBookInfo = Get-Content -Raw -Path $Path | ConvertFrom-Yaml

    $hshRecordBookInfo.RecordDetails | Select-Object *,
        @{n="ChallengerName"; e={$oThisRecord = $_; $hshRecordBookInfo.Challengers | Where-Object{$_.ChallengerId -eq $oThisRecord.ChallengerID} | ForEach-Object{$_.FirstName, $_.LastName -join " "}}},
        @{n="RecordName"; e={$oThisRecord = $_; ($hshRecordBookInfo.RecordNames | Where-Object{$_.RecordNumber -eq $oThisRecord.RecordNumber}).RecordName}}
}